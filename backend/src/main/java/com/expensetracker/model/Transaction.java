package com.expensetracker.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDate date;
    private String description;
    private Double amount;
    private Double balance;
    private String category;
    private String bankName;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
}
