package com.expensetracker.service;

import com.expensetracker.dto.NotificationPreferenceDto;
import com.expensetracker.model.User;
import com.expensetracker.model.UserNotificationPreference;
import com.expensetracker.repository.UserNotificationPreferenceRepository;
import com.expensetracker.security.AuthenticationFacade;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationPreferenceService {
    private final UserNotificationPreferenceRepository repo;
    private final AuthenticationFacade auth;

    public NotificationPreferenceService(UserNotificationPreferenceRepository repo, AuthenticationFacade auth) {
        this.repo = repo; this.auth = auth;
    }

    public List<NotificationPreferenceDto> list() {
        User u = auth.currentUser();
        return repo.findByUser(u).stream().map(this::toDto).collect(Collectors.toList());
    }

    public NotificationPreferenceDto upsert(String type, boolean emailEnabled){
        User u = auth.currentUser();
        UserNotificationPreference pref = repo.findByUserAndType(u, type).orElseGet(()->{
            UserNotificationPreference p = new UserNotificationPreference();
            p.setUser(u); p.setType(type); return p; });
        pref.setEmailEnabled(emailEnabled);
        return toDto(repo.save(pref));
    }

    private NotificationPreferenceDto toDto(UserNotificationPreference p){
        return new NotificationPreferenceDto(p.getId(), p.getType(), p.isEmailEnabled());
    }
}
