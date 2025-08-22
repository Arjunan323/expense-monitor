package com.expensetracker.service.alerts;

import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.model.SpendingAlertSettings;
import com.expensetracker.model.SpendingAlert;
import java.util.*;
import java.math.*;
import java.time.LocalDate;

public class LargeTransactionRule implements SpendingAlertRule {
    @Override public String key(){ return "large_transaction"; }
    @Override
    public List<SpendingAlert> detect(User user, List<Transaction> monthTransactions, SpendingAlertSettings settings, java.util.Map<String, BigDecimal> baselineCatAvg, java.util.Set<String> whitelist, java.util.Set<String> muted, LocalDate from, LocalDate to){
        List<SpendingAlert> list = new ArrayList<>();
        for(var t: monthTransactions){
            if(t.getAmount()==null || t.getAmount().signum()>=0) continue; // expense only
            String cat = t.getCategory()==null?"":t.getCategory();
            if(muted.contains(cat.toLowerCase())) continue;
            String merchant = t.getMerchant()==null?"":t.getMerchant();
            if(whitelist.contains(merchant.toLowerCase())) continue;
            BigDecimal amtAbs = t.getAmount().abs();
            BigDecimal baseline = baselineCatAvg.getOrDefault(cat, BigDecimal.ZERO);
            BigDecimal threshold = baseline.multiply(BigDecimal.valueOf(settings.getLargeMultiplier()));
            BigDecimal minAbs = BigDecimal.valueOf(settings.getLargeMinAmount());
            boolean large = amtAbs.compareTo(threshold.max(minAbs))>0;
            if(large){
                Map<String,Object> meta = new HashMap<>();
                meta.put("baselineAvg", baseline);
                meta.put("threshold", threshold);
                meta.put("multiplier", settings.getLargeMultiplier());
                meta.put("txnId", t.getId());
                SpendingAlert a = new SpendingAlert();
                a.setUser(user); a.setType("large_transaction");
                a.setCategory(cat); a.setMerchant(merchant); a.setAmount(amtAbs); a.setTxnDate(t.getDate()); a.setTxnId(t.getId());
                try { a.setMetadata(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(meta)); } catch(Exception ignored){}
                list.add(a);
            }
        }
        return list;
    }
}