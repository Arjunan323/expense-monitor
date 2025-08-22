package com.expensetracker.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "spending_alert_whitelist")
public class SpendingAlertWhitelist {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;
    private String merchant;
    private LocalDateTime createdAt;
    @PrePersist public void pp(){ createdAt = LocalDateTime.now(); }
    public Long getId(){ return id; }
    public void setId(Long id){ this.id=id; }
    public User getUser(){ return user; }
    public void setUser(User user){ this.user=user; }
    public String getMerchant(){ return merchant; }
    public void setMerchant(String merchant){ this.merchant=merchant; }
    public LocalDateTime getCreatedAt(){ return createdAt; }
}
