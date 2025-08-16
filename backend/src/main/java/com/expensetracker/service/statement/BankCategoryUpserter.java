package com.expensetracker.service.statement;

import com.expensetracker.model.Bank;
import com.expensetracker.model.Category;
import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.repository.BankRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.util.AppConstants;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class BankCategoryUpserter {
    private final BankRepository bankRepository;
    private final CategoryRepository categoryRepository;

    public BankCategoryUpserter(BankRepository bankRepository, CategoryRepository categoryRepository) {
        this.bankRepository = bankRepository;
        this.categoryRepository = categoryRepository;
    }

    public void upsert(User user, List<Transaction> transactions) {
        Map<String, Long> bankCounts = new HashMap<>();
        Map<String, Long> categoryCounts = new HashMap<>();
        for (Transaction t : transactions) {
            String bank = t.getBankName() != null ? t.getBankName().trim() : AppConstants.UNKNOWN;
            String cat = t.getCategory() != null ? t.getCategory().trim() : AppConstants.UNKNOWN;
            if (bank.isEmpty()) bank = AppConstants.UNKNOWN;
            if (cat.isEmpty()) cat = AppConstants.UNKNOWN;
            bankCounts.put(bank, bankCounts.getOrDefault(bank, 0L) + 1);
            categoryCounts.put(cat, categoryCounts.getOrDefault(cat, 0L) + 1);
        }
        bankCounts.forEach((name,count)-> {
            Bank bank = bankRepository.findByUserAndNameIgnoreCase(user, name).orElse(null);
            if (bank == null) {
                bank = new Bank();
                bank.setName(name);
                bank.setUser(user);
                bank.setTransactionCount(count);
            } else {
                bank.increment(count);
            }
            bankRepository.save(bank);
        });
        categoryCounts.forEach((name,count)-> {
            Category cat = categoryRepository.findByUserAndNameIgnoreCase(user, name).orElse(null);
            if (cat == null) {
                cat = new Category();
                cat.setName(name);
                cat.setUser(user);
                cat.setTransactionCount(count);
            } else {
                cat.increment(count);
            }
            categoryRepository.save(cat);
        });
    }
}
