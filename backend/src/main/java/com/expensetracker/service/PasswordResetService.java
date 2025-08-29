package com.expensetracker.service;

import com.expensetracker.model.PasswordResetToken;
import com.expensetracker.model.User;
import com.expensetracker.repository.PasswordResetTokenRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PasswordResetService {
    private final PasswordResetTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final EmailTemplateService templateService;
    private final PasswordEncoder passwordEncoder;
    @Value("${app.mail.password-reset.ttl-seconds:1800}") private long ttl;
    @Value("${app.mail.password-reset.base-url:http://localhost:3000}") private String baseUrl;
    public PasswordResetService(PasswordResetTokenRepository tokenRepo, UserRepository userRepo, EmailService emailService, PasswordEncoder passwordEncoder, EmailTemplateService templateService){
        this.tokenRepo=tokenRepo; this.userRepo=userRepo; this.emailService=emailService; this.passwordEncoder=passwordEncoder; this.templateService = templateService; }
    public void request(String email){
        if(email==null || email.isBlank()) return;
        java.util.Optional<User> userOpt = userRepo.findByEmail(email.trim());
        if(userOpt.isEmpty()) return; // do not reveal
        User user = userOpt.get();
        tokenRepo.deleteByUser(user);
        PasswordResetToken token = PasswordResetToken.create(user, ttl);
        tokenRepo.save(token);
        String link = baseUrl+"/reset-password?token="+token.getToken();
    String html = templateService.renderPasswordReset(link, (int)(ttl/60));
    emailService.sendHtml(user.getEmail(), "Password Reset", html, "PASSWORD_RESET");
    }
    public boolean reset(String tokenValue, String newPassword){
        java.util.Optional<PasswordResetToken> opt = tokenRepo.findByToken(tokenValue);
        if(opt.isEmpty()) return false;
        PasswordResetToken t = opt.get();
        if(t.isConsumed() || t.isExpired()) return false;
        User user = t.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
        t.setConsumed(true);
        return true;
    }
}
