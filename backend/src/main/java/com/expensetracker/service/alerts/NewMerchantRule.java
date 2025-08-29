package com.expensetracker.service.alerts;

import com.expensetracker.model.*;
import java.time.*;
import java.util.*;
import java.math.*;

public class NewMerchantRule implements SpendingAlertRule {
    @Override public String key(){ return "new_merchant"; }
    @Override
    public java.util.List<SpendingAlert> detect(User user, java.util.List<Transaction> monthTransactions, SpendingAlertSettings settings, java.util.Map<String, BigDecimal> baselineCatAvg, java.util.Set<String> whitelist, java.util.Set<String> mutedCats, LocalDate from, LocalDate to){
        Set<String> seen = new HashSet<>();
        List<SpendingAlert> alerts = new ArrayList<>();
        for(var t: monthTransactions){
            if(t.getAmount()==null || t.getAmount().signum()>=0) continue; // only spend
            String merchant = t.getMerchant()==null?"":t.getMerchant();
            if(merchant.isBlank() || whitelist.contains(merchant.toLowerCase())) continue;
            if(t.getAmount().abs().doubleValue() >= settings.getNewMerchantMinAmount()){
                if(!seen.contains(merchant.toLowerCase())){
                    seen.add(merchant.toLowerCase());
                    Map<String,Object> meta = new HashMap<>(); meta.put("minAmount", settings.getNewMerchantMinAmount());
                    SpendingAlert a = new SpendingAlert(); a.setUser(user); a.setType("new_merchant"); a.setMerchant(merchant); a.setCategory(t.getCategory()); a.setAmount(t.getAmount().abs()); a.setTxnId(t.getId()); a.setTxnDate(t.getDate());
                    try { a.setMetadata(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(meta)); } catch(Exception ignored){}
                    alerts.add(a);
                }
            }
        }
        return alerts;
    }
}