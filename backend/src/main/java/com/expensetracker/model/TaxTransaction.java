package com.expensetracker.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tax_transactions")
public class TaxTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "tax_year")
    private Integer taxYear; // e.g. 2025

    @Column(precision = 19, scale = 4, nullable = false)
    private BigDecimal amount; // positive paid amount (refunds can be negative)

    @Column(name = "paid_date")
    private LocalDate paidDate;

    private String category; // INCOME_TAX, GST, VAT, etc.

    @Column(length = 1000)
    private String note;

    // Whether user wants to treat this payment as deductible toward a section limit
    @Column(name = "deductible")
    private Boolean deductible = Boolean.TRUE;

    // Whether supporting receipt / proof uploaded (future: could be separate table)
    @Column(name = "has_receipt")
    private Boolean hasReceipt = Boolean.FALSE;

    // Optional storage key / file reference (pre-signed key etc.)
    @Column(name = "receipt_key", length = 255)
    private String receiptKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_transaction_id")
    private Transaction sourceTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id")
    private TaxDeductionRule rule;

    @Column(name = "classification_status", length = 16)
    private String classificationStatus = "CONFIRMED"; // or SUGGESTED / REJECTED

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Integer getTaxYear() { return taxYear; }
    public void setTaxYear(Integer taxYear) { this.taxYear = taxYear; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getPaidDate() { return paidDate; }
    public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public Boolean getDeductible() { return deductible; }
    public void setDeductible(Boolean deductible) { this.deductible = deductible; }
    public Boolean getHasReceipt() { return hasReceipt; }
    public void setHasReceipt(Boolean hasReceipt) { this.hasReceipt = hasReceipt; }
    public String getReceiptKey() { return receiptKey; }
    public void setReceiptKey(String receiptKey) { this.receiptKey = receiptKey; }
    public Transaction getSourceTransaction() { return sourceTransaction; }
    public void setSourceTransaction(Transaction sourceTransaction) { this.sourceTransaction = sourceTransaction; }
    public TaxDeductionRule getRule() { return rule; }
    public void setRule(TaxDeductionRule rule) { this.rule = rule; }
    public String getClassificationStatus() { return classificationStatus; }
    public void setClassificationStatus(String classificationStatus) { this.classificationStatus = classificationStatus; }
}