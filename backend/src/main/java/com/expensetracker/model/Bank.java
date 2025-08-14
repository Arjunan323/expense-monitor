package com.expensetracker.model;

import jakarta.persistence.*;

@Entity
@Table(name = "banks", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "name"}))
public class Bank {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // Bank name (as appears in transactions)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Long transactionCount = 0L;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Long getTransactionCount() { return transactionCount; }
    public void setTransactionCount(Long transactionCount) { this.transactionCount = transactionCount; }
    public void increment(Long delta) { this.transactionCount = this.transactionCount + (delta == null ? 0 : delta); }
}
