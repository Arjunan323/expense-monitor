package com.expensetracker.model;

import jakarta.persistence.*;

@Entity
@Table(name = "plans", 
uniqueConstraints = @UniqueConstraint(columnNames = {"planType", "region"})
)
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(nullable = false)
    private String planType; // FREE, PRO, PREMIUM

    @Column(nullable = false)
    private String region; // e.g. IN, US, EU

    @Column(nullable = false)
    private String currency; // e.g. INR, USD, EUR

    private int amount; // in paise (INR)
    private int statementsPerMonth;
    private int pagesPerStatement;
    private String features; // comma-separated or JSON string
    // Maximum number of bank accounts that can be combined for analytics
    private Integer combinedBank; // nullable => fallback to legacy defaults

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
    public int getStatementsPerMonth() { return statementsPerMonth; }
    public void setStatementsPerMonth(int statementsPerMonth) { this.statementsPerMonth = statementsPerMonth; }
    public int getPagesPerStatement() { return pagesPerStatement; }
    public void setPagesPerStatement(int pagesPerStatement) { this.pagesPerStatement = pagesPerStatement; }
    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }
    public Integer getCombinedBank() { return combinedBank; }
    public void setCombinedBank(Integer combinedBank) { this.combinedBank = combinedBank; }
}
