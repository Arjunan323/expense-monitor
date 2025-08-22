package com.expensetracker.service;

import com.expensetracker.dto.*;
import com.expensetracker.model.*;
import com.expensetracker.model.SpendingAlert;
import com.expensetracker.model.User;
import com.expensetracker.repository.*;
import com.expensetracker.security.AuthenticationFacade;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;

@Service
@Transactional
public class SpendingAlertService {
    private final SpendingAlertRepository repo; private final AuthenticationFacade auth;
    private final SpendingAlertSettingsRepository settingsRepo;
    private final SpendingAlertWhitelistRepository whitelistRepo;
    private final SpendingAlertMutedCategoryRepository mutedCategoryRepo;
    private final SpendingAlertRecommendationRepository recommendationRepo;
    private final SpendingAlertAuditRepository auditRepo;
    private final com.expensetracker.stream.SpendingAlertStreamPublisher streamPublisher;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
    // Rule registry (order matters if later rules depend on earlier context)
    private final java.util.List<com.expensetracker.service.alerts.SpendingAlertRule> rules = java.util.List.of(
        new com.expensetracker.service.alerts.LargeTransactionRule(),
        new com.expensetracker.service.alerts.FrequencyRule(),
        new com.expensetracker.service.alerts.CategorySpikeRule(),
        new com.expensetracker.service.alerts.NewMerchantRule()
    );
    public SpendingAlertService(SpendingAlertRepository r, AuthenticationFacade a,
                                SpendingAlertSettingsRepository sr,
                                SpendingAlertWhitelistRepository wr,
                                SpendingAlertMutedCategoryRepository mcr,
                                SpendingAlertRecommendationRepository rr,
                                SpendingAlertAuditRepository ar,
                                com.expensetracker.stream.SpendingAlertStreamPublisher sp,
                                TransactionRepository tr,
                                UserRepository ur,
                                EmailNotificationService emailNotificationService){
        this.repo=r; this.auth=a; this.settingsRepo=sr; this.whitelistRepo=wr; this.mutedCategoryRepo=mcr; this.recommendationRepo=rr; this.auditRepo=ar; this.streamPublisher=sp; this.transactionRepository=tr; this.userRepository=ur; this.emailNotificationService = emailNotificationService;
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 10 * * * *") // hourly at minute 10
    public void scheduledRecomputeCurrentMonth(){
        var ym = java.time.YearMonth.now().toString();
        userRepository.findAll().forEach(u->{
            try { recomputeForUser(ym, u); } catch(Exception ignored){}
        });
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 5 2 * * *") // daily 02:05
    public void scheduledRecommendations(){
        var ym = java.time.YearMonth.now();
        userRepository.findAll().forEach(u->{
            try { generateRecommendationsForUser(ym, u); } catch(Exception ignored){}
        });
    }

    private void generateRecommendationsForUser(YearMonth ym, User u){
        String month = ym.toString();
        // Remove existing for month to regenerate
        recommendationRepo.findByUserAndMonthOrderByPriorityDesc(u, month).forEach(r-> recommendationRepo.delete(r));
        // Simple heuristic: suggest cap for top spike categories
        var outflows = transactionRepository.aggregateCategory(u, ym.minusMonths(3).atDay(1), ym.atEndOfMonth());
        outflows.stream().filter(c-> c.getTotalAmount()!=null && c.getTotalAmount().doubleValue()<0)
                .limit(3)
                .forEach(c->{
                    SpendingAlertRecommendation rec = new SpendingAlertRecommendation();
                    rec.setUser(u); rec.setMonth(month); rec.setType("suggested_limit"); rec.setPriority(10);
                    rec.setCategory(c.getCategory());
                    double avg = Math.abs(c.getTotalAmount().doubleValue())/3.0;
                    rec.setCurrentMonthlyAvg(avg);
                    rec.setSuggestedCap(avg*0.9);
                    rec.setTitle("Consider setting a limit for "+c.getCategory());
                    rec.setMessage("Average monthly spend is "+String.format("%.2f", avg)+". A cap of "+String.format("%.2f", avg*0.9)+" could keep you on track.");
                    rec.setIcon("target");
                    rec.setRationale("High spend category relative to others");
                    recommendationRepo.save(rec);
                });
    }

    public Page<SpendingAlertDto> list(String month, String type, String severity, String ackMode, int page, int size, String sort){
        User u = auth.currentUser();
        Boolean ack = switch(ackMode){
            case "true" -> Boolean.TRUE; case "false" -> Boolean.FALSE; default -> null; };
        YearMonth ym = month!=null && !month.isBlank()? YearMonth.parse(month) : YearMonth.now();
        LocalDate start = ym.atDay(1); LocalDate end = ym.atEndOfMonth();
        Pageable pageable = buildPageable(page,size,sort);
        var p = repo.search(u, normalize(type), normalize(severity), ack, start, end, pageable);
        return p.map(this::toDto);
    }

    public SpendingAlertListResponse listCombined(String month, String type, String severity, String ackMode, int page, int size, String sort){
        var pageResult = list(month, type, severity, ackMode, page, size, sort);
        var summary = summary(month);
        var meta = new SpendingAlertListResponse.PageMeta(pageResult.getNumber(), pageResult.getSize(), pageResult.getTotalElements(), pageResult.getTotalPages(), pageResult.isFirst(), pageResult.isLast());
        return new SpendingAlertListResponse(pageResult.getContent(), summary, meta);
    }

    private Pageable buildPageable(int page, int size, String sort){
        if(sort==null || sort.isBlank()) return PageRequest.of(page,size, Sort.by(Sort.Direction.DESC, "createdAt"));
        try {
            String[] parts = sort.split(",");
            String field = parts[0];
            Sort.Direction dir = (parts.length>1 && parts[1].equalsIgnoreCase("asc"))? Sort.Direction.ASC: Sort.Direction.DESC;
            return PageRequest.of(page,size, Sort.by(dir, field));
        } catch(Exception e){
            return PageRequest.of(page,size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
    }

    public SpendingAlertSummaryDto summary(String month){
        User u = auth.currentUser();
        SpendingAlertSettings settings = loadOrCreateSettings(u);
        long critical = repo.countByUserAndSeverityAndAcknowledgedFalseAndDismissedFalse(u, "critical");
        long moderate = repo.countByUserAndSeverityAndAcknowledgedFalseAndDismissedFalse(u, "moderate");
        long ack = repo.countByUserAndAcknowledgedTrueAndDismissedFalse(u);
    long total = critical + moderate + ack;
    return new SpendingAlertSummaryDto(critical, moderate, ack, total, settings.getLastGeneratedCount(), settings.getLastGeneratedAt());
    }

    public SpendingAlertDto acknowledge(Long id){
        User u = auth.currentUser();
        SpendingAlert a = repo.findById(id).orElseThrow();
        if(!a.getUser().getId().equals(u.getId())) throw new IllegalArgumentException("FORBIDDEN");
    if(!a.isAcknowledged()){ a.setAcknowledged(true); a.setAcknowledgedAt(java.time.LocalDateTime.now()); }
    recordAudit(a, "acknowledged");
    var dto = toDto(a);
    streamPublisher.publish("alert.acknowledged", dto);
    streamPublisher.publish("alert.updated", dto);
        return toDto(a);
    }

    public void dismiss(Long id){
        User u = auth.currentUser();
        SpendingAlert a = repo.findById(id).orElseThrow();
        if(!a.getUser().getId().equals(u.getId())) throw new IllegalArgumentException("FORBIDDEN");
    a.setDismissed(true); a.setDismissedAt(java.time.LocalDateTime.now());
    recordAudit(a, "dismissed");
    var dto = toDto(a);
    streamPublisher.publish("alert.dismissed", dto);
    streamPublisher.publish("alert.updated", dto);
    }

    public SpendingAlertDto get(Long id){
        User u = auth.currentUser();
        SpendingAlert a = repo.findById(id).orElseThrow();
        if(!a.getUser().getId().equals(u.getId())) throw new IllegalArgumentException("FORBIDDEN");
        return toDto(a);
    }

    public java.util.List<SpendingAlertDto> bulkAcknowledge(java.util.List<Long> ids){
        User u = auth.currentUser();
        var list = repo.findAllById(ids);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        list.stream().filter(a-> a.getUser().getId().equals(u.getId()) && !a.isAcknowledged())
                .forEach(a->{ a.setAcknowledged(true); a.setAcknowledgedAt(now); });
    list.forEach(a->{ recordAudit(a, "acknowledged"); streamPublisher.publish("alert.acknowledged", toDto(a)); });
        return list.stream().map(this::toDto).toList();
    }

    public void bulkDismiss(java.util.List<Long> ids){
        User u = auth.currentUser();
        var list = repo.findAllById(ids);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        list.stream().filter(a-> a.getUser().getId().equals(u.getId()) && !a.isDismissed())
                .forEach(a->{ a.setDismissed(true); a.setDismissedAt(now); });
    list.forEach(a->{ recordAudit(a, "dismissed"); streamPublisher.publish("alert.dismissed", toDto(a)); });
    }

    private void recordAudit(SpendingAlert alert, String action){
        SpendingAlertAudit audit = new SpendingAlertAudit();
        audit.setAlert(alert); audit.setUser(alert.getUser()); audit.setAction(action);
        auditRepo.save(audit);
    }

    // Settings
    public SpendingAlertSettingsDto getSettings(){
        User u = auth.currentUser();
    SpendingAlertSettings s = loadOrCreateSettings(u);
        return toDto(s);
    }
    public SpendingAlertSettingsDto updateSettings(SpendingAlertSettingsDto dto){
        User u = auth.currentUser();
    SpendingAlertSettings s = settingsRepo.findByUser(u).orElseGet(()-> loadOrCreateSettings(u));
        s.setLargeMultiplier(dto.largeMultiplier());
        s.setLargeMinAmount(dto.largeMinAmount());
        s.setFreqWindowHours(dto.freqWindowHours());
        s.setFreqMaxTxn(dto.freqMaxTxn());
        s.setFreqMinAmount(dto.freqMinAmount());
        s.setCatSpikeMultiplier(dto.catSpikeMultiplier());
        s.setCatSpikeLookbackMonths(dto.catSpikeLookbackMonths());
        s.setCatSpikeMinAmount(dto.catSpikeMinAmount());
        s.setNewMerchantMinAmount(dto.newMerchantMinAmount());
    s.setCriticalLargeAbsolute(dto.criticalLargeAbsolute());
    s.setCriticalCategorySpikeMultiplier(dto.criticalCategorySpikeMultiplier());
    s.setCriticalFrequencyCount(dto.criticalFrequencyCount());
    s.setCriticalNewMerchantAbsolute(dto.criticalNewMerchantAbsolute());
        settingsRepo.save(s);
        return toDto(s);
    }
    private SpendingAlertSettings loadOrCreateSettings(User u){
        return settingsRepo.findByUser(u).orElseGet(()-> {
            SpendingAlertSettings ns = new SpendingAlertSettings(); ns.setUser(u);
            try { return settingsRepo.save(ns); }
            catch(org.springframework.dao.DataIntegrityViolationException ex){
                // Another thread created concurrently; fetch existing
                return settingsRepo.findByUser(u).orElseThrow();
            }
        });
    }
    private SpendingAlertSettingsDto toDto(SpendingAlertSettings s){
    return new SpendingAlertSettingsDto(s.getLargeMultiplier(), s.getLargeMinAmount(), s.getFreqWindowHours(), s.getFreqMaxTxn(), s.getFreqMinAmount(), s.getCatSpikeMultiplier(), s.getCatSpikeLookbackMonths(), s.getCatSpikeMinAmount(), s.getNewMerchantMinAmount(), s.getCriticalLargeAbsolute(), s.getCriticalCategorySpikeMultiplier(), s.getCriticalFrequencyCount(), s.getCriticalNewMerchantAbsolute());
    }

    // Whitelist
    public java.util.List<String> listWhitelist(){
        User u = auth.currentUser();
        return whitelistRepo.findByUser(u).stream().map(SpendingAlertWhitelist::getMerchant).toList();
    }
    public void addWhitelist(String merchant){
        User u = auth.currentUser();
        if(whitelistRepo.findByUser(u).stream().noneMatch(w-> w.getMerchant().equalsIgnoreCase(merchant))){
            SpendingAlertWhitelist w = new SpendingAlertWhitelist(); w.setUser(u); w.setMerchant(merchant); whitelistRepo.save(w);
        }
    }
    public void deleteWhitelist(String merchant){
        User u = auth.currentUser();
        whitelistRepo.deleteByUserAndMerchant(u, merchant);
    }

    // Muted categories
    public java.util.List<SpendingAlertMutedCategory> listMuted(){
        User u = auth.currentUser();
        return mutedCategoryRepo.findByUser(u);
    }
    public void muteCategory(String category, java.time.LocalDate until){
        User u = auth.currentUser();
        var existing = mutedCategoryRepo.findByUser(u).stream().filter(m-> m.getCategory().equalsIgnoreCase(category)).findFirst();
        SpendingAlertMutedCategory m = existing.orElseGet(()->{ SpendingAlertMutedCategory nm = new SpendingAlertMutedCategory(); nm.setUser(u); nm.setCategory(category); return nm; });
        m.setMuteUntil(until); mutedCategoryRepo.save(m);
    }
    public void unmuteCategory(String category){
        User u = auth.currentUser();
        mutedCategoryRepo.deleteByUserAndCategory(u, category);
    }

    // Recommendations
    public java.util.List<SpendingAlertRecommendationDto> recommendations(String month){
        User u = auth.currentUser();
        String ym = (month==null || month.isBlank())? java.time.YearMonth.now().toString(): month;
        return recommendationRepo.findByUserAndMonthOrderByPriorityDesc(u, ym).stream().map(this::toDto).toList();
    }
    private SpendingAlertRecommendationDto toDto(SpendingAlertRecommendation r){
        return new SpendingAlertRecommendationDto(r.getId(), r.getType(), r.getPriority(), r.getTitle(), r.getMessage(), r.getIcon(), r.getCategory(), r.getCurrentMonthlyAvg(), r.getSuggestedCap(), r.getRationale());
    }

    // Metadata
    public java.util.Map<String,Object> meta(){
        return java.util.Map.of(
            "types", java.util.List.of(
                java.util.Map.of("key","large_transaction","label","Large Transactions","defaultSeverity","critical"),
                java.util.Map.of("key","new_merchant","label","New Merchants","defaultSeverity","moderate"),
                java.util.Map.of("key","frequency","label","Frequency","defaultSeverity","moderate"),
                java.util.Map.of("key","category_spike","label","Category Spikes","defaultSeverity","critical")
            ),
            "severities", java.util.List.of("critical","moderate"),
            "streamEvents", java.util.List.of("alert.new","alert.updated","alert.acknowledged","alert.dismissed")
        );
    }

    // Audit
    public java.util.List<SpendingAlertAuditDto> audit(Long id){
        User u = auth.currentUser();
        SpendingAlert a = repo.findById(id).orElseThrow();
        if(!a.getUser().getId().equals(u.getId())) throw new IllegalArgumentException("FORBIDDEN");
        return auditRepo.findByAlertOrderByAtAsc(a).stream().map(x-> new SpendingAlertAuditDto(x.getAction(), x.getAt())).toList();
    }

    // Recompute (stub implementation)
    public SpendingAlertRecomputeResponse recompute(String month){
    User u = auth.currentUser(); // explicit user request
    return recomputeForUser(month, u);
    }

    private SpendingAlertRecomputeResponse recomputeForUser(String month, User u){
        long start = System.currentTimeMillis();
        YearMonth ym = (month==null||month.isBlank())? YearMonth.now(): YearMonth.parse(month);
        LocalDate from = ym.atDay(1); LocalDate to = ym.atEndOfMonth();
        // Load settings
    SpendingAlertSettings settings = loadOrCreateSettings(u);
        var whitelist = whitelistRepo.findByUser(u).stream().map(w-> w.getMerchant().toLowerCase()).collect(java.util.stream.Collectors.toSet());
        var mutedCats = mutedCategoryRepo.findByUser(u).stream()
                .filter(m-> m.getMuteUntil()==null || !m.getMuteUntil().isBefore(LocalDate.now()))
                .map(m-> m.getCategory().toLowerCase()).collect(java.util.stream.Collectors.toSet());

    // Fetch existing alerts in month; only replace ones that are not acknowledged/dismissed to retain user actions
    var existingAll = repo.search(u,null,null,null,from,to,PageRequest.of(0,2000)).getContent();
    var existingRetained = existingAll.stream().filter(a-> a.isAcknowledged() || a.isDismissed()).toList();
    var existingReplaceable = existingAll.stream().filter(a-> !a.isAcknowledged() && !a.isDismissed()).toList();
    long replaced = existingReplaceable.size();
    if(!existingReplaceable.isEmpty()) repo.deleteAll(existingReplaceable);

        java.util.List<TransactionRepository.CategorySpendProjection> baselineCat = transactionRepository.aggregateCategory(u, from.minusMonths(settings.getCatSpikeLookbackMonths()), from.minusDays(1));
        java.util.Map<String, java.math.BigDecimal> baselineCatAvg = new java.util.HashMap<>();
        baselineCat.forEach(p->{
            java.math.BigDecimal total = p.getTotalAmount()==null? java.math.BigDecimal.ZERO : p.getTotalAmount();
            int months = settings.getCatSpikeLookbackMonths();
            baselineCatAvg.put(p.getCategory()==null?"":p.getCategory(), total.divide(java.math.BigDecimal.valueOf(months), java.math.RoundingMode.HALF_UP));
        });

        var monthTxns = transactionRepository.findByUserAndDateRange(u, from, to);
        java.util.List<SpendingAlert> newAlerts = new java.util.ArrayList<>();

        // Delegate detection to rules
        for(var rule : rules){
            try {
                var produced = rule.detect(u, monthTxns, settings, baselineCatAvg, whitelist, mutedCats, from, to);
                for(var a : produced){
                    // finalize properties if rule left them unset
                    if(a.getSeverity()==null){
                        java.util.Map<String,Object> meta = null;
                        if(a.getMetadata()!=null){
                            try { meta = objectMapper.readValue(a.getMetadata(), new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String,Object>>(){}); } catch(Exception ignored){}
                        }
                        a.setSeverity(suggestSeverity(a.getType(), a.getAmount(), meta));
                    }
                    if(a.getTitle()==null) a.setTitle(titleFor(a.getType()));
                    if(a.getDescription()==null) a.setDescription(descriptionFor(a.getType(), a.getAmount(), a.getCategory(), a.getMerchant()));
                    if(a.getReason()==null) a.setReason("Rule: " + rule.key());
                }
                newAlerts.addAll(produced);
            } catch(Exception ex){
                // swallow rule exception to avoid aborting full recompute; could log
            }
        }

        // Duplicate suppression: create signature set (type+merchant+category+txnId/date)
        java.util.Set<String> sigs = new java.util.HashSet<>();
        java.util.List<SpendingAlert> deduped = new java.util.ArrayList<>();
        for(var a: newAlerts){
            String sig = a.getType()+"|"+(a.getMerchant()==null?"":a.getMerchant())+"|"+(a.getCategory()==null?"":a.getCategory())+"|"+(a.getTxnId()==null? a.getTxnDate(): a.getTxnId());
            if(sigs.add(sig)) { deduped.add(a); }
        }
        java.util.List<SpendingAlert> finalAlerts = deduped;

        // Batch save for performance
    // Filter out alerts that duplicate retained user-acted alerts (same signature)
    java.util.Set<String> retainedSigs = existingRetained.stream().map(a-> a.getType()+"|"+(a.getMerchant()==null?"":a.getMerchant())+"|"+(a.getCategory()==null?"":a.getCategory())+"|"+(a.getTxnId()==null? a.getTxnDate(): a.getTxnId())).collect(java.util.stream.Collectors.toSet());
    var finalFiltered = finalAlerts.stream().filter(a-> !retainedSigs.contains(a.getType()+"|"+(a.getMerchant()==null?"":a.getMerchant())+"|"+(a.getCategory()==null?"":a.getCategory())+"|"+(a.getTxnId()==null? a.getTxnDate(): a.getTxnId()))).toList();
    repo.saveAll(finalFiltered);
    finalFiltered.forEach(a->{
        streamPublisher.publish("alert.new", toDto(a));
        recordAudit(a, "created");
        try { emailNotificationService.maybeSendSpendingAlert(a); } catch(Exception ignored) {}
    });
    long generated = finalFiltered.size();
    long duration = System.currentTimeMillis() - start;
    // persist generation stats
    settings.setLastGeneratedAt(java.time.LocalDateTime.now());
    settings.setLastGeneratedCount(generated);
    settingsRepo.save(settings);
    return new SpendingAlertRecomputeResponse(generated, replaced, duration);
    }

    private String suggestSeverity(String type, java.math.BigDecimal amt, java.util.Map<String,Object> meta){
        SpendingAlertSettings settings = settingsRepo.findByUser(auth.currentUser()).orElse(null); // lightweight read
        if("large_transaction".equals(type)){
            if(settings!=null && settings.getCriticalLargeAbsolute()!=null && amt!=null && amt.compareTo(java.math.BigDecimal.valueOf(settings.getCriticalLargeAbsolute()))>=0) return "critical";
            if(meta!=null){
                Object threshold = meta.get("threshold");
                if(threshold instanceof java.math.BigDecimal th && amt!=null && settings!=null && settings.getCriticalLargeAbsolute()==null){
                    if(amt.compareTo(th.multiply(java.math.BigDecimal.valueOf(1.25)))>0) return "critical";
                }
            }
            return "moderate";
        }
        if("category_spike".equals(type)){
            if(settings!=null && settings.getCriticalCategorySpikeMultiplier()!=null && meta!=null){
                Object multiplier = meta.get("multiplier");
                if(multiplier instanceof Number n && n.doubleValue()>= settings.getCriticalCategorySpikeMultiplier()) return "critical";
            }
            return "moderate";
        }
        if("frequency".equals(type)){
            if(settings!=null && settings.getCriticalFrequencyCount()!=null && meta!=null){
                Object count = meta.get("count");
                if(count instanceof Number c && c.intValue()>= settings.getCriticalFrequencyCount()) return "critical";
            }
            return "moderate";
        }
        if("new_merchant".equals(type)){
            if(settings!=null && settings.getCriticalNewMerchantAbsolute()!=null && amt!=null && amt.compareTo(java.math.BigDecimal.valueOf(settings.getCriticalNewMerchantAbsolute()))>=0) return "critical";
            return "moderate";
        }
        return "moderate";
    }
    private String titleFor(String type){
        return switch(type){
            case "large_transaction" -> "Large Transaction Detected";
            case "new_merchant" -> "New Merchant";
            case "frequency" -> "Unusual Frequency";
            case "category_spike" -> "Category Spending Spike";
            default -> "Spending Alert";
        };
    }
    private String descriptionFor(String type, java.math.BigDecimal amt, String category, String merchant){
        return switch(type){
            case "large_transaction" -> "Transaction exceeds typical amount (" + amt + ")";
            case "new_merchant" -> "First high-value spend at " + merchant;
            case "frequency" -> "Multiple transactions detected in short window";
            case "category_spike" -> "Spending spike in category " + category;
            default -> "Unusual spending pattern";
        };
    }

    private String normalize(String v){ return (v==null || v.equals("all") || v.isBlank()) ? null : v; }
    private SpendingAlertDto toDto(SpendingAlert a){
        java.util.Map<String,Object> parsed = null;
        if(a.getMetadata()!=null){
            try { parsed = objectMapper.readValue(a.getMetadata(), new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String,Object>>(){}); } catch(Exception ignored){}
        }
        return new SpendingAlertDto(
                a.getId(),
                a.getType(),
                a.getSeverity(),
                a.getTitle(),
                a.getDescription(),
                a.getAmount(),
                a.getMerchant(),
                a.getCategory(),
                a.getTxnDate(),
                a.getReason(),
                a.isAcknowledged(),
                a.getAcknowledgedAt(),
                a.isDismissed(),
                a.getDismissedAt(),
                a.getCreatedAt(),
                a.getTxnId(),
                a.getMetadata(),
                parsed
        );
    }

    // Merchant normalization backfill (batch incremental)
    @Transactional
    public long normalizeMerchants(int batchSize, int maxBatches){
        long updated=0; int batches=0;
        org.springframework.data.domain.Pageable p = org.springframework.data.domain.PageRequest.of(0,batchSize);
        var page = transactionRepository.findUnnormalized(p);
        while(!page.isEmpty() && batches<maxBatches){
            for(var t: page){
                String derived = com.expensetracker.util.MerchantNormalizer.normalize(t.getMerchant()!=null? t.getMerchant(): t.getDescription());
                if(derived!=null && (t.getMerchant()==null || !t.getMerchant().equals(derived))){ t.setMerchant(derived); updated++; }
            }
            transactionRepository.saveAll(page.getContent());
            batches++;
            if(!page.hasNext()) break;
            p = page.nextPageable();
            page = transactionRepository.findUnnormalized(p);
        }
        return updated;
    }
}
