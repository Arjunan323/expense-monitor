package com.expensetracker.service.statement;

import com.expensetracker.model.RawStatement;
import com.expensetracker.model.User;
import com.expensetracker.repository.RawStatementRepository;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class RawStatementPersister {
    private final RawStatementRepository rawStatementRepository;

    public RawStatementPersister(RawStatementRepository rawStatementRepository) {
        this.rawStatementRepository = rawStatementRepository;
    }

    public RawStatement persist(User user, String filename, String rawJson, int pageCount) {
        return persist(user, filename, rawJson, pageCount, null);
    }

    public RawStatement persist(User user, String filename, String rawJson, int pageCount, String storageKey) {
        RawStatement rawStatement = new RawStatement();
        rawStatement.setUploadDate(LocalDateTime.now());
        rawStatement.setFilename(filename);
        rawStatement.setRawJson(rawJson);
        rawStatement.setUser(user);
        rawStatement.setPageCount(pageCount);
        if(storageKey!=null) rawStatement.setStorageKey(storageKey);
        String bankName = null;
        try {
            JSONArray arr = new JSONArray(rawJson);
            if (arr.length() > 0) {
                JSONObject first = arr.getJSONObject(0);
                bankName = first.optString("bankName", null);
            }
        } catch (Exception ignored) {}
        rawStatement.setBankName(bankName);
        return rawStatementRepository.save(rawStatement);
    }
}
