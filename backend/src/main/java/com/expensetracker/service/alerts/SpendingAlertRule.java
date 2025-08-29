package com.expensetracker.service.alerts;

import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import com.expensetracker.model.SpendingAlertSettings;
import com.expensetracker.model.SpendingAlert;
import java.time.LocalDate;
import java.util.List;

public interface SpendingAlertRule {
    String key();
    List<SpendingAlert> detect(User user,
                               List<Transaction> monthTransactions,
                               SpendingAlertSettings settings,
                               java.util.Map<String, java.math.BigDecimal> baselineCategoryAverages,
                               java.util.Set<String> whitelist,
                               java.util.Set<String> mutedCategories,
                               LocalDate from,
                               LocalDate to);
}