package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "spending_alert_audit")
public class SpendingAlertAudit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "alert_id")
    private SpendingAlert alert;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    private User user;
    private String action; // created, acknowledged, dismissed
    private LocalDateTime at;
    @PrePersist public void pp(){ at = LocalDateTime.now(); }
    public Long getId(){ return id; }
    public SpendingAlert getAlert(){ return alert; }
    public void setAlert(SpendingAlert alert){ this.alert=alert; }
    public User getUser(){ return user; }
    public void setUser(User user){ this.user=user; }
    public String getAction(){ return action; }
    public void setAction(String action){ this.action=action; }
    public LocalDateTime getAt(){ return at; }
}
