package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String message;
    private String type; // GENERAL, ANALYTICS
    @Column(length = 2000)
    private String meta; // JSON string of additional data (e.g., selected feature flags)
    private LocalDateTime createdAt;

    public Feedback() {}
    public Feedback(String email, String message, String type, String meta, LocalDateTime createdAt) {
        this.email = email;
        this.message = message;
        this.type = type;
        this.meta = meta;
        this.createdAt = createdAt;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMeta() { return meta; }
    public void setMeta(String meta) { this.meta = meta; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
