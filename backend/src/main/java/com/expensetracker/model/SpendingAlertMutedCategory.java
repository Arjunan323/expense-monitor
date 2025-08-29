package com.expensetracker.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "spending_alert_muted_category")
public class SpendingAlertMutedCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;
    private String category;
    private LocalDate muteUntil; // nullable
    private LocalDateTime createdAt;
    @PrePersist public void pp(){ createdAt = LocalDateTime.now(); }
    public Long getId(){ return id; }
    public void setId(Long id){ this.id=id; }
    public User getUser(){ return user; }
    public void setUser(User user){ this.user=user; }
    public String getCategory(){ return category; }
    public void setCategory(String category){ this.category=category; }
    public LocalDate getMuteUntil(){ return muteUntil; }
    public void setMuteUntil(LocalDate muteUntil){ this.muteUntil=muteUntil; }
    public LocalDateTime getCreatedAt(){ return createdAt; }
}
