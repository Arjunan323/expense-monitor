package com.expensetracker.dto;

public class BankDto {
    private Long id;
    private String name;
    private Long transactionCount;

    public BankDto() {}
    public BankDto(Long id, String name, Long transactionCount) {
        this.id = id;
        this.name = name;
        this.transactionCount = transactionCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getTransactionCount() { return transactionCount; }
    public void setTransactionCount(Long transactionCount) { this.transactionCount = transactionCount; }
}
