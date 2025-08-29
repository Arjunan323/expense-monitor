package com.expensetracker.repository;

import com.expensetracker.model.TaxClassificationIgnore;
import com.expensetracker.model.User;
import com.expensetracker.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TaxClassificationIgnoreRepository extends JpaRepository<TaxClassificationIgnore, Long> {
    boolean existsByUserAndSourceTransaction(User user, Transaction tx);
    Optional<TaxClassificationIgnore> findByUserAndSourceTransaction(User user, Transaction tx);
}
