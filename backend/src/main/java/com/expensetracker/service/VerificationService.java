package com.expensetracker.service;

import com.expensetracker.model.EmailVerificationToken;
import com.expensetracker.model.User;
import com.expensetracker.repository.EmailVerificationTokenRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class VerificationService {
    private final EmailVerificationTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final EmailTemplateService templateService;
    @Value("${app.mail.verification.ttl-seconds:3600}") private long ttl;
    @Value("${app.mail.verification.base-url:http://localhost:3000}") private String baseUrl;

    public VerificationService(EmailVerificationTokenRepository tokenRepo, UserRepository userRepo, EmailService emailService, EmailTemplateService templateService){
        this.tokenRepo=tokenRepo; this.userRepo=userRepo; this.emailService=emailService; this.templateService = templateService;
    }

    public void sendVerification(User user){
        // Throttle: if last token created within 2 minutes, skip
        tokenRepo.findFirstByUserOrderByCreatedAtDesc(user).ifPresent(existing -> {
            if(existing.getCreatedAt()!=null && existing.getCreatedAt().isAfter(java.time.Instant.now().minusSeconds(120))) {
                throw new RuntimeException("Too many requests. Try again later.");
            }
        });
        tokenRepo.deleteByUser(user); // invalidate previous
        EmailVerificationToken token = EmailVerificationToken.create(user, ttl);
        tokenRepo.save(token);
        String link = baseUrl+"/verify-email?token="+token.getToken();
        String html = templateService.renderVerification(user.getFirstName()!=null? user.getFirstName(): "", link, (int)(ttl/60));
        emailService.sendHtml(user.getEmail(), "Verify your email", html, "VERIFICATION");
    }

    public boolean verify(String tokenValue){
        var opt = tokenRepo.findByToken(tokenValue);
        if(opt.isEmpty()) return false;
        var t = opt.get();
        if(t.isConsumed() || t.isExpired()) return false;
        var user = t.getUser();
        user.setEmailVerified(true);
        userRepo.save(user);
        t.setConsumed(true);
        // send welcome email asynchronously
        try {
            String welcome = templateService.renderWelcome(user.getFirstName()!=null? user.getFirstName(): "");
            emailService.sendHtml(user.getEmail(), "Welcome to CutTheSpend", welcome, "WELCOME");
        } catch(Exception ignored) {}
        return true;
    }
}
