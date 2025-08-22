package com.expensetracker.service;

import com.expensetracker.dto.TaxDeductionRuleDto;
import com.expensetracker.dto.TaxRuleTestResultDto;
import com.expensetracker.model.*;
import com.expensetracker.repository.TaxDeductionRuleRepository;
import com.expensetracker.repository.TaxTransactionRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.TaxClassificationIgnoreRepository;
import com.expensetracker.security.AuthenticationFacade;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaxRuleService {
    private final TaxDeductionRuleRepository ruleRepo;
    private final TaxTransactionRepository taxRepo;
    private final TransactionRepository transactionRepo;
    private final AuthenticationFacade auth;
    private final TaxClassificationIgnoreRepository ignoreRepo;

    public TaxRuleService(TaxDeductionRuleRepository ruleRepo, TaxTransactionRepository taxRepo, TransactionRepository transactionRepo, TaxClassificationIgnoreRepository ignoreRepo, AuthenticationFacade auth){
        this.ruleRepo = ruleRepo; this.taxRepo=taxRepo; this.transactionRepo=transactionRepo; this.ignoreRepo=ignoreRepo; this.auth=auth;
    }

    private static class CachedRules { List<TaxDeductionRule> rules; long loadedAt; }
    private final java.util.concurrent.ConcurrentHashMap<Long, CachedRules> cache = new java.util.concurrent.ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60_000; // 1 minute

    private List<TaxDeductionRule> loadActive(User u){
        long now = System.currentTimeMillis();
        CachedRules c = cache.get(u.getId());
        if(c!=null && (now - c.loadedAt) < CACHE_TTL_MS) return c.rules;
        List<TaxDeductionRule> rules = ruleRepo.findActiveRules(u);
        CachedRules n = new CachedRules(); n.rules = rules; n.loadedAt = now; cache.put(u.getId(), n); return rules;
    }

    public List<TaxDeductionRuleDto> list(){
        var u = auth.currentUser();
        return ruleRepo.findByUser(u).stream().map(this::toDto).collect(Collectors.toList());
    }

    public TaxDeductionRuleDto create(TaxDeductionRuleDto dto){
        var u = auth.currentUser();
        TaxDeductionRule r = new TaxDeductionRule();
        r.setUser(u);
        r.setMatchType(TaxDeductionRule.MatchType.valueOf(dto.matchType()));
        r.setMatchValue(dto.matchValue());
        r.setTaxCategoryCode(dto.taxCategoryCode());
        r.setPriority(dto.priority()!=null? dto.priority():0);
        r.setAutoMarkDeductible(dto.autoMarkDeductible()!=null? dto.autoMarkDeductible():Boolean.TRUE);
        r.setActive(dto.active()!=null? dto.active():Boolean.TRUE);
    var saved = ruleRepo.save(r);
    cache.remove(u.getId());
    return toDto(saved);
    }

    public TaxDeductionRuleDto update(Long id, TaxDeductionRuleDto dto){
        var u = auth.currentUser();
        TaxDeductionRule r = ruleRepo.findById(id).filter(rr-> rr.getUser()!=null && rr.getUser().getId().equals(u.getId())).orElseThrow();
        if(dto.matchType()!=null) r.setMatchType(TaxDeductionRule.MatchType.valueOf(dto.matchType()));
        if(dto.matchValue()!=null) r.setMatchValue(dto.matchValue());
        if(dto.taxCategoryCode()!=null) r.setTaxCategoryCode(dto.taxCategoryCode());
        if(dto.priority()!=null) r.setPriority(dto.priority());
        if(dto.autoMarkDeductible()!=null) r.setAutoMarkDeductible(dto.autoMarkDeductible());
        if(dto.active()!=null) r.setActive(dto.active());
    cache.remove(u.getId());
    return toDto(r);
    }

    public void delete(Long id){
        var u = auth.currentUser();
        ruleRepo.findById(id).filter(rr-> rr.getUser()!=null && rr.getUser().getId().equals(u.getId())).ifPresent(r->{ ruleRepo.delete(r); cache.remove(u.getId());});
    }

    public TaxRuleTestResultDto test(String matchType,
                                     String matchValue,
                                     String description,
                                     BigDecimal amount,
                                     String category,
                                     String merchant,
                                     String taxCategoryCode,
                                     Boolean autoMarkDeductible){
        try {
            TaxDeductionRule.MatchType mt = TaxDeductionRule.MatchType.valueOf(matchType);
            boolean matches = evaluate(mt, matchValue, description, amount, category, merchant);
            return new TaxRuleTestResultDto(matches, taxCategoryCode, autoMarkDeductible != null ? autoMarkDeductible : Boolean.TRUE, null);
        } catch (IllegalArgumentException ex){
            return new TaxRuleTestResultDto(false, taxCategoryCode, autoMarkDeductible != null ? autoMarkDeductible : Boolean.TRUE, "Invalid matchType: " + matchType);
        }
    }

    private boolean evaluate(TaxDeductionRule.MatchType type, String value, String description, BigDecimal amount, String category, String merchant){
        switch(type){
            case CATEGORY: return category!=null && category.equalsIgnoreCase(value);
            case MERCHANT: return merchant!=null && merchant.equalsIgnoreCase(value);
            case DESCRIPTION_REGEX: return description!=null && Pattern.compile(value, Pattern.CASE_INSENSITIVE).matcher(description).find();
            case AMOUNT_RANGE: {
                if(amount==null) return false; String[] parts = value.split(":" );
                BigDecimal min = parts.length>0 && !parts[0].isBlank()? new BigDecimal(parts[0]) : null;
                BigDecimal max = parts.length>1 && !parts[1].isBlank()? new BigDecimal(parts[1]) : null;
                BigDecimal abs = amount.abs();
                return (min==null || abs.compareTo(min)>=0) && (max==null || abs.compareTo(max)<=0);
            }
            default: return false;
        }
    }

    public int classifyRange(LocalDate start, LocalDate end) {
        var u = auth.currentUser();
        var rules = loadActive(u);
        var txns = transactionRepo.findByUserAndDateRange(u, start, end);
        int created=0;
        for(Transaction t : txns){
            if(t.getAmount()==null || t.getAmount().signum()>=0) continue; // only outflows
            boolean already = taxRepo.existsByUserAndSourceTransactionId(u, t.getId());
            if(already) continue;
            if(ignoreRepo.existsByUserAndSourceTransaction(u, t)) continue; // user opted to ignore this source txn
            TaxDeductionRule matched = null;
            for(TaxDeductionRule r : rules){
                if(evaluate(r.getMatchType(), r.getMatchValue(), t.getDescription(), t.getAmount(), t.getCategory(), t.getBankName())){ matched = r; break; }
            }
            if(matched!=null){
                var tax = new TaxTransaction();
                tax.setUser(u);
                tax.setSourceTransaction(t);
                tax.setRule(matched);
                tax.setTaxYear(t.getDate()!=null? t.getDate().getYear(): start.getYear());
                tax.setPaidDate(t.getDate());
                tax.setAmount(t.getAmount().abs());
                tax.setCategory(matched.getTaxCategoryCode());
                tax.setNote(t.getDescription());
                tax.setDeductible(matched.getAutoMarkDeductible());
                tax.setHasReceipt(Boolean.FALSE);
                tax.setClassificationStatus(matched.getAutoMarkDeductible()? "CONFIRMED": "SUGGESTED");
                taxRepo.save(tax);
                created++;
            }
        }
        return created;
    }

    private TaxDeductionRuleDto toDto(TaxDeductionRule r){
        return new TaxDeductionRuleDto(r.getId(), r.getMatchType().name(), r.getMatchValue(), r.getTaxCategoryCode(), r.getPriority(), r.getAutoMarkDeductible(), r.getActive(), r.getUser()==null);
    }

    // ---- Suggestion approval / rejection ----
    public int approve(List<Long> ids){
        var u = auth.currentUser();
        var list = taxRepo.findAllById(ids).stream().filter(t-> t.getUser().getId().equals(u.getId())).toList();
        int count=0; for(var t : list){ if("SUGGESTED".equals(t.getClassificationStatus())){ t.setClassificationStatus("CONFIRMED"); count++; } }
        return count;
    }
    public int reject(List<Long> ids){
        var u = auth.currentUser();
        var list = taxRepo.findAllById(ids).stream().filter(t-> t.getUser().getId().equals(u.getId())).toList();
        int count=0; for(var t : list){ if("SUGGESTED".equals(t.getClassificationStatus())){ t.setClassificationStatus("REJECTED"); count++; } }
        return count;
    }
}
