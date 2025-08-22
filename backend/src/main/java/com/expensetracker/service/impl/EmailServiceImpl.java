package com.expensetracker.service.impl;

import com.expensetracker.service.EmailService;
import com.expensetracker.service.EmailTemplateService;
import com.expensetracker.service.EmailAuditService;
import com.expensetracker.model.EmailAudit;
import com.expensetracker.security.AuthenticationFacade;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger; import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamSource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Service
public class EmailServiceImpl implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);
    private final JavaMailSender sender;
    private final String fromAddress;
    private final String fromName;

    private final EmailAuditService auditService;
    private final AuthenticationFacade auth;
    private final EmailTemplateService templateService;

    public EmailServiceImpl(JavaMailSender sender,
                            @Value("${app.mail.from.address}") String fromAddress,
                            @Value("${app.mail.from.name}") String fromName,
                            EmailAuditService auditService,
                            AuthenticationFacade auth,
                            EmailTemplateService templateService) {
        this.sender = sender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.auditService = auditService;
        this.auth = auth;
        this.templateService = templateService;
    }

    private String from(){ return String.format("%s <%s>", fromName, fromAddress); }

    @Override
    @Async
    public void sendPlain(String to, String subject, String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from());
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        try {
            sender.send(msg);
            audit(to, subject, null, "SENT", null, null);
        } catch(Exception e){
            audit(to, subject, null, "FAILED", e.getMessage(), null);
            throw e;
        }
    }

    @Override
    @Async
    public void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage mm = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mm, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
            helper.setFrom(from());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            sender.send(mm);
            audit(to, subject, null, "SENT", null, null);
        } catch (MessagingException e) {
            log.error("Failed to send HTML mail: {}", e.getMessage(), e);
            audit(to, subject, null, "FAILED", e.getMessage(), null);
            throw new RuntimeException("Email send failed", e);
        }
    }

    public void sendHtml(String to, String subject, String html, String type) {
        try {
            MimeMessage mm = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mm, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());
            helper.setFrom(from());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            sender.send(mm);
            audit(to, subject, type, "SENT", null, null);
        } catch (MessagingException e) {
            log.error("Failed to send HTML mail: {}", e.getMessage(), e);
            audit(to, subject, type, "FAILED", e.getMessage(), null);
            throw new RuntimeException("Email send failed", e);
        }
    }

    @Override
    @Async
    public void sendWithTemplate(String to, String subject, String templateName, Map<String, Object> model) {
        String html;
        switch (templateName) {
            case "verification" -> html = templateService.renderVerification(String.valueOf(model.getOrDefault("firstName","")), String.valueOf(model.get("verificationLink")), (Integer) model.getOrDefault("ttlMinutes", 60));
            case "password-reset" -> html = templateService.renderPasswordReset(String.valueOf(model.get("resetLink")), (Integer) model.getOrDefault("ttlMinutes", 30));
            case "goal-progress" -> html = templateService.renderGoalProgress(String.valueOf(model.get("goalName")), (Integer) model.getOrDefault("progressPercent", 0));
            default -> html = templateService.renderThemed(templateName, subject, null, model);
        }
        sendHtml(to, subject, html);
    }

    @Override
    @Async
    public void sendWithAttachment(String to, String subject, String body, String attachmentFilename, InputStreamSource data, String contentType) {
        try {
            MimeMessage mm = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mm, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            helper.addAttachment(attachmentFilename, data, contentType);
            sender.send(mm);
            audit(to, subject, null, "SENT", null, attachmentFilename);
        } catch (MessagingException e) {
            log.error("Failed to send mail with attachment: {}", e.getMessage(), e);
            audit(to, subject, null, "FAILED", e.getMessage(), attachmentFilename);
            throw new RuntimeException("Email send failed", e);
        }
    }

    private void audit(String to, String subject, String type, String status, String error, String attachment){
        try {
            EmailAudit a = new EmailAudit();
            a.setEmail(to);
            a.setSubject(subject);
            a.setType(type);
            a.setStatus(status);
            a.setErrorMessage(error);
            a.setCorrelationId(UUID.randomUUID().toString());
            if(attachment!=null) a.setMetadata("{\"attachment\":\""+attachment+"\"}");
            // associate current user if present
            try { var u = auth.currentUser(); a.setUser(u); } catch(Exception ignore){}
            auditService.save(a);
        } catch(Exception ex){ log.warn("Email audit save failed: {}", ex.getMessage()); }
    }
}
