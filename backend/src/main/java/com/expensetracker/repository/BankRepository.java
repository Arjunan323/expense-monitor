package com.expensetracker.repository;

import com.expensetracker.model.Bank;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface BankRepository extends JpaRepository<Bank, Long> {
    Optional<Bank> findByUserAndNameIgnoreCase(User user, String name);
    List<Bank> findByUser(User user);
}
