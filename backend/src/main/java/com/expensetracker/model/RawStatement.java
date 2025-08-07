package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "raw_statements")
public class RawStatement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private LocalDateTime uploadDate;
    private String filename;
    @Column(columnDefinition = "TEXT")
    private String rawJson;
    private String bankName;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDateTime getUploadDate() { return uploadDate; }
    public void setUploadDate(LocalDateTime uploadDate) { this.uploadDate = uploadDate; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getRawJson() { return rawJson; }
    public void setRawJson(String rawJson) { this.rawJson = rawJson; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; } 
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
}
