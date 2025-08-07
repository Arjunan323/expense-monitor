package com.expensetracker.dto;

import java.time.LocalDateTime;
import java.util.List;

public class RawStatementDto {
    private Long id;
    private String fileName;
    private LocalDateTime uploadDate;
    private String status;
    private String bankName;
    private Integer transactionCount;
    private List<String> parseWarnings;

    public RawStatementDto() {}

    public RawStatementDto(Long id, String fileName, LocalDateTime uploadDate, String status, String bankName, Integer transactionCount, List<String> parseWarnings) {
        this.id = id;
        this.fileName = fileName;
        this.uploadDate = uploadDate;
        this.status = status;
        this.bankName = bankName;
        this.transactionCount = transactionCount;
        this.parseWarnings = parseWarnings;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public LocalDateTime getUploadDate() { return uploadDate; }
    public void setUploadDate(LocalDateTime uploadDate) { this.uploadDate = uploadDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public Integer getTransactionCount() { return transactionCount; }
    public void setTransactionCount(Integer transactionCount) { this.transactionCount = transactionCount; }
    public List<String> getParseWarnings() { return parseWarnings; }
    public void setParseWarnings(List<String> parseWarnings) { this.parseWarnings = parseWarnings; }
}
