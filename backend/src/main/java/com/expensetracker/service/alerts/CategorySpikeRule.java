package com.expensetracker.service.alerts;

import com.expensetracker.model.*;
import java.time.*;
import java.util.*;
import java.math.*;

public class CategorySpikeRule implements SpendingAlertRule {
    @Override public String key(){ return "category_spike"; }
    @Override
    public java.util.List<SpendingAlert> detect(User user, java.util.List<Transaction> monthTransactions, SpendingAlertSettings settings, java.util.Map<String, BigDecimal> baselineCatAvg, java.util.Set<String> whitelist, java.util.Set<String> mutedCats, LocalDate from, LocalDate to){
        Map<String, BigDecimal> totals = new HashMap<>();
        for(var t: monthTransactions){
            if(t.getAmount()==null || t.getAmount().signum()>=0) continue;
            String c = t.getCategory()==null?"":t.getCategory();
            if(mutedCats.contains(c.toLowerCase())) continue;
            totals.merge(c, t.getAmount().abs(), BigDecimal::add);
        }
        List<SpendingAlert> alerts = new ArrayList<>();
        for(var entry: totals.entrySet()){
            String cat = entry.getKey(); BigDecimal total = entry.getValue();
            BigDecimal baseline = baselineCatAvg.getOrDefault(cat, BigDecimal.ZERO);
            if(baseline.compareTo(BigDecimal.ZERO)>0){
                BigDecimal spikeThreshold = baseline.multiply(BigDecimal.valueOf(settings.getCatSpikeMultiplier()));
                if(total.compareTo(spikeThreshold.max(BigDecimal.valueOf(settings.getCatSpikeMinAmount())))>0){
                    Map<String,Object> meta = new HashMap<>(); meta.put("baselineAvg", baseline); meta.put("multiplier", settings.getCatSpikeMultiplier()); meta.put("threshold", spikeThreshold); meta.put("lookbackMonths", settings.getCatSpikeLookbackMonths());
                    SpendingAlert a = new SpendingAlert(); a.setUser(user); a.setType("category_spike"); a.setCategory(cat); a.setAmount(total); a.setTxnDate(to); // use end date
                    try { a.setMetadata(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(meta)); } catch(Exception ignored){}
                    alerts.add(a);
                }
            }
        }
        return alerts;
    }
}
