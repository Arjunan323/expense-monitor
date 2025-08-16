package com.expensetracker.service.statement;

import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.util.AppConstants;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Component
public class TransactionParser {
    public List<Transaction> parse(String rawJson, User user, String fallbackBankName) {
        List<Transaction> transactions = new ArrayList<>();
        JSONArray arr = new JSONArray(rawJson);
        for (int i = 0; i < arr.length(); i++) {
            JSONObject obj = arr.getJSONObject(i);
            Transaction txn = new Transaction();
            txn.setDate(LocalDate.parse(obj.getString("date")));
            txn.setDescription(obj.getString("description"));
            txn.setAmount(asBigDecimal(obj, "amount"));
            txn.setBalance(asBigDecimal(obj, "balance"));
            txn.setCategory(obj.optString("category", AppConstants.UNKNOWN));
            txn.setUser(user);
            txn.setBankName(obj.optString("bankName", fallbackBankName != null ? fallbackBankName : AppConstants.UNKNOWN));
            // Build stable signature components (normalized)
            String bank = txn.getBankName() != null ? txn.getBankName().trim().toUpperCase() : "";
            String desc = txn.getDescription() != null ? txn.getDescription().trim().toUpperCase() : "";
            String dateStr = txn.getDate() != null ? txn.getDate().toString() : "";
            String amt = txn.getAmount() != null ? txn.getAmount().stripTrailingZeros().toPlainString() : "0";
            String bal = txn.getBalance() != null ? txn.getBalance().stripTrailingZeros().toPlainString() : "0";
            String signature = String.join("|", bank, dateStr, desc, amt, bal, user.getId().toString());
            txn.setTxnHash(sha256(signature));
            transactions.add(txn);
        }
        return transactions;
    }

        private BigDecimal asBigDecimal(JSONObject obj, String field) {
            if (!obj.has(field) || obj.isNull(field)) return BigDecimal.ZERO;
            Object v = obj.get(field);
            if (v instanceof Number) {
                return new BigDecimal(v.toString());
            }
            if (v instanceof String s && !s.isBlank()) {
                try { return new BigDecimal(s.replaceAll(",", "")); } catch (NumberFormatException e) { return BigDecimal.ZERO; }
            }
            return BigDecimal.ZERO;
        }

        private String sha256(String input) {
            try {
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                for (byte b : hash) {
                    sb.append(String.format("%02x", b));
                }
                return sb.toString();
            } catch (Exception e) {
                return null;
            }
        }
}
