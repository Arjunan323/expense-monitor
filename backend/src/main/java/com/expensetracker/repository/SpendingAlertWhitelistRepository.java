package com.expensetracker.repository;

import com.expensetracker.model.SpendingAlertWhitelist;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpendingAlertWhitelistRepository extends JpaRepository<SpendingAlertWhitelist, Long> {
    List<SpendingAlertWhitelist> findByUser(User user);
    void deleteByUserAndMerchant(User user, String merchant);
}
