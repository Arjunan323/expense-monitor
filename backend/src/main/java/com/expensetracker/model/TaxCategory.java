package com.expensetracker.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tax_categories")
public class TaxCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String code; // e.g. INCOME_TAX
    private String description;
    @Column(name = "annual_limit", precision = 19, scale = 2)
    private java.math.BigDecimal annualLimit; // monetary limit (0 or null = no explicit limit)

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public java.math.BigDecimal getAnnualLimit() { return annualLimit; }
    public void setAnnualLimit(java.math.BigDecimal annualLimit) { this.annualLimit = annualLimit; }
}