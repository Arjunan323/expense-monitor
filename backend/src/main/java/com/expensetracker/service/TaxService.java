package com.expensetracker.service;

import com.expensetracker.dto.TaxTransactionDto;
import com.expensetracker.dto.TaxCategoryUsageDto;
import com.expensetracker.dto.TaxSummaryDto;
import com.expensetracker.dto.TaxInsightDto;
import com.expensetracker.model.TaxTransaction;
import com.expensetracker.model.TaxCategory;
import com.expensetracker.model.User;
import com.expensetracker.repository.TaxTransactionRepository;
import com.expensetracker.repository.TaxClassificationIgnoreRepository;
import com.expensetracker.repository.TaxCategoryRepository;
import com.expensetracker.security.AuthenticationFacade;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaxService {
    private final TaxTransactionRepository repo;
    private final TaxCategoryRepository categoryRepo;
    private final TaxClassificationIgnoreRepository ignoreRepo;
    private final AuthenticationFacade auth;
    public TaxService(TaxTransactionRepository repo, TaxCategoryRepository categoryRepo, TaxClassificationIgnoreRepository ignoreRepo, AuthenticationFacade auth){this.repo=repo;this.categoryRepo=categoryRepo;this.ignoreRepo=ignoreRepo;this.auth=auth;}

    public List<TaxTransactionDto> list(Integer year){
        User u = auth.currentUser();
        List<TaxTransaction> list = (year==null? repo.findByUser(u) : repo.findByUserAndTaxYear(u, year));
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public TaxTransactionDto create(TaxTransactionDto dto){
        User u = auth.currentUser();
        TaxTransaction t = new TaxTransaction();
        t.setUser(u);
        t.setTaxYear(dto.taxYear());
        t.setCategory(dto.category());
        t.setAmount(dto.amount());
        t.setPaidDate(dto.paidDate());
        t.setNote(dto.note());
        t.setDeductible(dto.deductible()==null? Boolean.TRUE : dto.deductible());
        t.setHasReceipt(dto.hasReceipt()==null? Boolean.FALSE : dto.hasReceipt());
    return toDto(repo.save(t));
    }

    public TaxTransactionDto update(Long id, TaxTransactionDto dto){
        User u = auth.currentUser();
        TaxTransaction t = repo.findById(id).filter(e->e.getUser().getId().equals(u.getId())).orElseThrow();
        t.setTaxYear(dto.taxYear());
        t.setCategory(dto.category());
        t.setAmount(dto.amount());
        t.setPaidDate(dto.paidDate());
    t.setNote(dto.note());
    if(dto.deductible()!=null) t.setDeductible(dto.deductible());
    if(dto.hasReceipt()!=null) t.setHasReceipt(dto.hasReceipt());
        return toDto(t);
    }

    public void delete(Long id){
        User u = auth.currentUser();
        repo.findById(id).filter(e->e.getUser().getId().equals(u.getId())).ifPresent(t -> {
            // If this tax transaction originated from a source transaction and user deletes it, remember ignore
            var src = t.getSourceTransaction();
            if(src!=null && !ignoreRepo.existsByUserAndSourceTransaction(u, src)){
                var ign = new com.expensetracker.model.TaxClassificationIgnore();
                ign.setUser(u); ign.setSourceTransaction(src);
                ignoreRepo.save(ign);
            }
            repo.delete(t);
        });
    }

    public TaxTransactionDto get(Long id){
        User u = auth.currentUser();
        TaxTransaction t = repo.findById(id).filter(e->e.getUser().getId().equals(u.getId())).orElseThrow();
        return toDto(t);
    }

    public TaxTransactionDto toggleDeductible(Long id){
        User u = auth.currentUser();
        TaxTransaction t = repo.findById(id).filter(e->e.getUser().getId().equals(u.getId())).orElseThrow();
        t.setDeductible(t.getDeductible()==null || !t.getDeductible());
        return toDto(t);
    }

    public TaxTransactionDto markReceipt(Long id){
        User u = auth.currentUser();
        TaxTransaction t = repo.findById(id).filter(e->e.getUser().getId().equals(u.getId())).orElseThrow();
        t.setHasReceipt(Boolean.TRUE);
        return toDto(t);
    }

    public TaxTransactionDto uploadReceipt(Long id, MultipartFile file){
        if(file==null || file.isEmpty()) throw new IllegalArgumentException("File empty");
        User u = auth.currentUser();
        TaxTransaction t = repo.findById(id).filter(e->e.getUser().getId().equals(u.getId())).orElseThrow();
        try {
            String baseDir = java.util.Optional.ofNullable(System.getProperty("tax.receipts.dir")).orElse("receipts");
            java.nio.file.Path dir = java.nio.file.Paths.get(baseDir);
            java.nio.file.Files.createDirectories(dir);
            String ext = org.springframework.util.StringUtils.getFilenameExtension(file.getOriginalFilename());
            String filename = "tx-"+id + (ext!=null? "."+ext : "");
            java.nio.file.Path dest = dir.resolve(filename);
            file.transferTo(dest.toFile());
            t.setReceiptKey(dest.toAbsolutePath().toString());
            t.setHasReceipt(Boolean.TRUE);
            return toDto(t);
        } catch(Exception ex){ throw new RuntimeException("Failed to store receipt", ex); }
    }

    public org.springframework.http.ResponseEntity<byte[]> downloadReceipt(Long id){
        User u = auth.currentUser();
        TaxTransaction t = repo.findById(id).filter(e->e.getUser().getId().equals(u.getId())).orElseThrow();
        if(t.getReceiptKey()==null) return org.springframework.http.ResponseEntity.notFound().build();
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(t.getReceiptKey());
            if(!java.nio.file.Files.exists(path)) return org.springframework.http.ResponseEntity.notFound().build();
            byte[] bytes = java.nio.file.Files.readAllBytes(path);
            String ct = java.nio.file.Files.probeContentType(path);
            return org.springframework.http.ResponseEntity.ok()
                    .header("Content-Type", ct!=null? ct: "application/octet-stream")
                    .header("Content-Disposition", "inline; filename=\""+path.getFileName()+"\"")
                    .body(bytes);
        } catch(Exception ex){ throw new RuntimeException("Failed to read receipt", ex); }
    }

    public List<com.expensetracker.dto.GenericKeyValue<Integer, java.math.BigDecimal>> yearTotals(){
        User u = auth.currentUser();
        return repo.aggregateYearTotals(u).stream()
                .map(p-> new com.expensetracker.dto.GenericKeyValue<>(p.getYear(), p.getTotal()))
                .collect(Collectors.toList());
    }

    public List<TaxTransactionDto> suggestions(){
        User u = auth.currentUser();
        return repo.findSuggested(u).stream().map(this::toDto).collect(Collectors.toList());
    }

    public org.springframework.data.domain.Page<TaxTransactionDto> suggestionsPaged(int page, int size){
        User u = auth.currentUser();
        var pg = repo.pageSuggested(u, org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("id").descending()));
        return pg.map(this::toDto);
    }

    private TaxTransactionDto toDto(TaxTransaction e){
        var src = e.getSourceTransaction();
        Long srcId = src!=null? src.getId(): null;
        String sDesc = src!=null? src.getDescription(): null;
        String sCat = src!=null? src.getCategory(): null;
        java.math.BigDecimal sAmt = src!=null? src.getAmount(): null;
        String sBank = src!=null? src.getBankName(): null;
        return new TaxTransactionDto(e.getId(), e.getTaxYear(), e.getCategory(), e.getAmount(), e.getPaidDate(), e.getNote(), e.getDeductible(), e.getHasReceipt(), e.getClassificationStatus(), srcId, sDesc, sCat, sAmt, sBank);
    }

    public TaxSummaryDto summary(Integer year){
        User u = auth.currentUser();
        var total = repo.totalDeductible(u, year);
        long missing = repo.countMissingReceipts(u, year);
        var usage = buildCategoryUsage(u, year);
        // Assume 30% bracket for now (could be dynamic later)
        java.math.BigDecimal estimatedSavings = total.multiply(java.math.BigDecimal.valueOf(0.30));
        return new TaxSummaryDto(year, total, estimatedSavings, (int)missing, usage);
    }

    public java.util.List<TaxInsightDto> insights(Integer year){
        var summary = summary(year);
        java.util.List<TaxInsightDto> list = new java.util.ArrayList<>();
        summary.categories().forEach(c -> {
            if(c.overLimit()){
                list.add(new TaxInsightDto("OVER-"+c.code(), "WARNING", "ERROR", "Exceeded limit for "+c.code()+" by "+c.used().subtract(c.annualLimit()), c.code()));
            } else if(c.nearLimit()){
                list.add(new TaxInsightDto("NEAR-"+c.code(), "TIP", "WARN", "Approaching limit for "+c.code()+" ("+String.format("%.1f", c.percentUsed())+"%)", c.code()));
            } else if(c.annualLimit()!=null){
                var remaining = c.annualLimit().subtract(c.used());
                list.add(new TaxInsightDto("REMAIN-"+c.code(), "TIP", "INFO", "You have "+remaining+" remaining under "+c.code(), c.code()));
            }
        });
        if(summary.missingReceipts()>0){
            list.add(new TaxInsightDto("MISSING-RECEIPTS", "ACTION", "WARN", summary.missingReceipts()+" receipt(s) missing for deductible claims", null));
        }
        return list;
    }

    private java.util.List<TaxCategoryUsageDto> buildCategoryUsage(User u, Integer year){
        var byCategory = repo.aggregateCategoryTotals(u, year).stream()
                .collect(java.util.stream.Collectors.toMap(TaxTransactionRepository.CategoryTotal::getCategory, TaxTransactionRepository.CategoryTotal::getTotal));
        var categories = categoryRepo.findAll();
        return categories.stream().map(c -> mapUsage(c, byCategory.getOrDefault(c.getCode(), java.math.BigDecimal.ZERO))).collect(java.util.stream.Collectors.toList());
    }

    private TaxCategoryUsageDto mapUsage(TaxCategory c, java.math.BigDecimal used){
        java.math.BigDecimal limit = c.getAnnualLimit();
        java.math.BigDecimal remaining = (limit==null? java.math.BigDecimal.ZERO : limit.subtract(used.max(java.math.BigDecimal.ZERO)));
        double percent = (limit==null || limit.signum()==0)? 0d : used.multiply(java.math.BigDecimal.valueOf(100)).divide(limit, java.math.RoundingMode.HALF_UP).doubleValue();
        boolean overLimit = limit!=null && used.compareTo(limit)>0;
        boolean nearLimit = !overLimit && limit!=null && percent>=80.0;
        return new TaxCategoryUsageDto(c.getCode(), c.getDescription(), limit, used, remaining, percent, overLimit, nearLimit);
    }
}