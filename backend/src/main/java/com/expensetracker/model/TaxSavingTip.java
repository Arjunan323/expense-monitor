package com.expensetracker.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tax_saving_tips")
public class TaxSavingTip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String message;
    private String icon;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
}
