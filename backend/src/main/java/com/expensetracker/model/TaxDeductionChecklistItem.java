package com.expensetracker.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tax_deduction_checklist")
public class TaxDeductionChecklistItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String item;
    private String category;
    private Boolean checked;
    private String amount;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getItem() { return item; }
    public void setItem(String item) { this.item = item; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Boolean getChecked() { return checked; }
    public void setChecked(Boolean checked) { this.checked = checked; }
    public String getAmount() { return amount; }
    public void setAmount(String amount) { this.amount = amount; }
}
