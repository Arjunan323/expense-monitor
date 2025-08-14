package com.expensetracker.dto;

public class StatementUploadResponseDto {
    private boolean success;
    private String message;
    private boolean passwordRequired;

    public StatementUploadResponseDto() {}

    public StatementUploadResponseDto(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public StatementUploadResponseDto(boolean success, String message, boolean passwordRequired) {
        this.success = success;
        this.message = message;
        this.passwordRequired = passwordRequired;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isPasswordRequired() { return passwordRequired; }
    public void setPasswordRequired(boolean passwordRequired) { this.passwordRequired = passwordRequired; }
}
