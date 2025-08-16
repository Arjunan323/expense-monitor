package com.expensetracker.dto;

public class StatementUploadResponseDto {
    private boolean success;
    private String message;
    private boolean passwordRequired;
    private String jobId; // present when async processing enabled

    public StatementUploadResponseDto() {}

    public StatementUploadResponseDto(boolean success, String message) { this.success = success; this.message = message; }

    public StatementUploadResponseDto(boolean success, String message, boolean passwordRequired) {
        this.success = success;
        this.message = message;
        this.passwordRequired = passwordRequired;
    }

    public StatementUploadResponseDto(boolean success, String message, String jobId) {
        this.success = success;
        this.message = message;
        this.jobId = jobId;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isPasswordRequired() { return passwordRequired; }
    public void setPasswordRequired(boolean passwordRequired) { this.passwordRequired = passwordRequired; }
    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }
}
