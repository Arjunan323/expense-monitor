package com.expensetracker.service;

import org.springframework.core.io.InputStreamSource;

import java.util.Map;

public interface EmailService {
    void sendPlain(String to, String subject, String body);
    void sendHtml(String to, String subject, String html);
    default void sendHtml(String to, String subject, String html, String type){ sendHtml(to, subject, html); }
    void sendWithTemplate(String to, String subject, String templateName, Map<String,Object> model);
    void sendWithAttachment(String to, String subject, String body, String attachmentFilename, InputStreamSource data, String contentType);
}
