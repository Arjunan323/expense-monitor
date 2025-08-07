package com.expensetracker.dto;

import java.time.LocalDate;

public class TransactionDto {
    private Long id;
    private LocalDate date;
    private String description;
    private double amount;
    private double balance;
    private String category;

    public TransactionDto(Long id, LocalDate date, String description, double amount, double balance, String category) {
        this.id = id;
        this.date = date;
        this.description = description;
        this.amount = amount;
        this.balance = balance;
        this.category = category;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public double getBalance() { return balance; }
    public void setBalance(double balance) { this.balance = balance; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
