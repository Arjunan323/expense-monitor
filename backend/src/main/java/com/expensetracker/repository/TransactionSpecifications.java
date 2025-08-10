package com.expensetracker.repository;

import com.expensetracker.model.Transaction;
import com.expensetracker.model.User;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.*;
import java.time.LocalDate;
import java.util.List;

public class TransactionSpecifications {
    public static Specification<Transaction> filter(
            User user,
            List<String> banks,
            List<String> categories,
            LocalDate startDate,
            LocalDate endDate,
            Double amountMin,
            Double amountMax,
            String transactionType,
            String description
    ) {
        return (Root<Transaction> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            Predicate predicate = cb.equal(root.get("user"), user);

            if (banks != null && !banks.isEmpty()) {
                predicate = cb.and(predicate, root.get("bankName").in(banks));
            }
            if (categories != null && !categories.isEmpty()) {
                predicate = cb.and(predicate, root.get("category").in(categories));
            }
            if (startDate != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("date"), startDate));
            }
            if (endDate != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("date"), endDate));
            }
            if (amountMin != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(cb.abs(root.get("amount")), amountMin));
            }
            if (amountMax != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(cb.abs(root.get("amount")), amountMax));
            }
            if (transactionType != null) {
                if (transactionType.equalsIgnoreCase("credit")) {
                    predicate = cb.and(predicate, cb.greaterThan(root.get("amount"), 0));
                } else if (transactionType.equalsIgnoreCase("debit")) {
                    predicate = cb.and(predicate, cb.lessThan(root.get("amount"), 0));
                }
            }
            if (description != null && !description.isEmpty()) {
                predicate = cb.and(predicate, cb.like(cb.lower(root.get("description")), "%" + description.toLowerCase() + "%"));
            }
            return predicate;
        };
    }
}
