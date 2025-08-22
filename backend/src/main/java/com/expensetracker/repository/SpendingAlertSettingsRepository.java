package com.expensetracker.repository;

import com.expensetracker.model.SpendingAlertSettings;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SpendingAlertSettingsRepository extends JpaRepository<SpendingAlertSettings, Long> {
    Optional<SpendingAlertSettings> findByUser(User user);
}
