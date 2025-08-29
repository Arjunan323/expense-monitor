package com.expensetracker.repository;

import com.expensetracker.model.User;
import com.expensetracker.model.UserNotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreference, Long> {
    List<UserNotificationPreference> findByUser(User user);
    Optional<UserNotificationPreference> findByUserAndType(User user, String type);
}
