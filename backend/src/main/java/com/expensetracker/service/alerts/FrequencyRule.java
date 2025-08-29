package com.expensetracker.service.alerts;

import com.expensetracker.model.*;
import java.time.*;
import java.util.*;
import java.math.*;

public class FrequencyRule implements SpendingAlertRule {
    @Override public String key(){ return "frequency"; }
    @Override
    public java.util.List<SpendingAlert> detect(User user, java.util.List<Transaction> monthTransactions, SpendingAlertSettings settings, java.util.Map<String, BigDecimal> baselineCatAvg, java.util.Set<String> whitelist, java.util.Set<String> mutedCats, LocalDate from, LocalDate to){
        Map<String,List<Transaction>> byMerchant = new HashMap<>();
        for(var t: monthTransactions){
            if(t.getAmount()==null) continue;
            String merchant = t.getMerchant()==null?"":t.getMerchant();
            if(merchant.isBlank()) continue;
            byMerchant.computeIfAbsent(merchant.toLowerCase(), k-> new ArrayList<>()).add(t);
        }
        List<SpendingAlert> alerts = new ArrayList<>();
        for(var e: byMerchant.entrySet()){
            if(whitelist.contains(e.getKey())) continue;
            var txList = e.getValue().stream().filter(t-> t.getAmount()!=null && t.getAmount().abs().doubleValue()>= settings.getFreqMinAmount())
                    .sorted(java.util.Comparator.comparing(Transaction::getDate)).toList();
            for(int i=0;i<txList.size();i++){
                var base = txList.get(i);
                int count=1; LocalDate baseDate = base.getDate();
                for(int j=i+1;j<txList.size();j++){
                    var other = txList.get(j);
                    long hours = Duration.between(baseDate.atStartOfDay(), other.getDate().atStartOfDay()).toHours();
                    if(hours <= settings.getFreqWindowHours()) count++; else break;
                }
                if(count > settings.getFreqMaxTxn()){
                    Map<String,Object> meta = new HashMap<>(); meta.put("count", count); meta.put("windowHours", settings.getFreqWindowHours()); meta.put("minAmount", settings.getFreqMinAmount());
                    SpendingAlert a = new SpendingAlert(); a.setUser(user); a.setType("frequency"); a.setMerchant(base.getMerchant()); a.setCategory(base.getCategory()); a.setAmount(base.getAmount().abs()); a.setTxnDate(base.getDate()); a.setTxnId(base.getId());
                    try { a.setMetadata(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(meta)); } catch(Exception ignored){}
                    alerts.add(a); break;
                }
            }
        }
        return alerts;
    }
}
