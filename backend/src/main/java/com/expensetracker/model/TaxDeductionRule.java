package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tax_deduction_rules")
public class TaxDeductionRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // null = global

    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", length = 32, nullable = false)
    private MatchType matchType;

    @Column(name = "match_value", length = 500, nullable = false)
    private String matchValue;

    @Column(name = "tax_category_code", length = 64, nullable = false)
    private String taxCategoryCode;

    @Column(name = "priority", nullable = false)
    private Integer priority = 0;

    @Column(name = "auto_mark_deductible", nullable = false)
    private Boolean autoMarkDeductible = Boolean.TRUE;

    @Column(name = "active", nullable = false)
    private Boolean active = Boolean.TRUE;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public enum MatchType { CATEGORY, MERCHANT, DESCRIPTION_REGEX, AMOUNT_RANGE }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public MatchType getMatchType() { return matchType; }
    public void setMatchType(MatchType matchType) { this.matchType = matchType; }
    public String getMatchValue() { return matchValue; }
    public void setMatchValue(String matchValue) { this.matchValue = matchValue; }
    public String getTaxCategoryCode() { return taxCategoryCode; }
    public void setTaxCategoryCode(String taxCategoryCode) { this.taxCategoryCode = taxCategoryCode; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
    public Boolean getAutoMarkDeductible() { return autoMarkDeductible; }
    public void setAutoMarkDeductible(Boolean autoMarkDeductible) { this.autoMarkDeductible = autoMarkDeductible; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
