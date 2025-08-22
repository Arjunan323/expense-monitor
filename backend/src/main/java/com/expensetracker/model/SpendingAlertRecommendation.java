package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "spending_alert_recommendation")
public class SpendingAlertRecommendation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id")
    private User user;
    @Column(length = 7)
    private String month; // YYYY-MM
    private String type; // tip / suggested_limit
    private int priority;
    private String title;
    @Column(length = 1000)
    private String message;
    private String icon;
    private String category;
    private Double currentMonthlyAvg;
    private Double suggestedCap;
    private String rationale;
    private LocalDateTime createdAt;
    @PrePersist public void pp(){ createdAt = LocalDateTime.now(); }
    public Long getId(){ return id; }
    public void setId(Long id){ this.id=id; }
    public User getUser(){ return user; }
    public void setUser(User user){ this.user=user; }
    public String getMonth(){ return month; }
    public void setMonth(String month){ this.month=month; }
    public String getType(){ return type; }
    public void setType(String type){ this.type=type; }
    public int getPriority(){ return priority; }
    public void setPriority(int priority){ this.priority=priority; }
    public String getTitle(){ return title; }
    public void setTitle(String title){ this.title=title; }
    public String getMessage(){ return message; }
    public void setMessage(String message){ this.message=message; }
    public String getIcon(){ return icon; }
    public void setIcon(String icon){ this.icon=icon; }
    public String getCategory(){ return category; }
    public void setCategory(String category){ this.category=category; }
    public Double getCurrentMonthlyAvg(){ return currentMonthlyAvg; }
    public void setCurrentMonthlyAvg(Double currentMonthlyAvg){ this.currentMonthlyAvg=currentMonthlyAvg; }
    public Double getSuggestedCap(){ return suggestedCap; }
    public void setSuggestedCap(Double suggestedCap){ this.suggestedCap=suggestedCap; }
    public String getRationale(){ return rationale; }
    public void setRationale(String rationale){ this.rationale=rationale; }
    public LocalDateTime getCreatedAt(){ return createdAt; }
}
