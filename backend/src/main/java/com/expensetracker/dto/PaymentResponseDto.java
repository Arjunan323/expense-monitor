package com.expensetracker.dto;

public class PaymentResponseDto {
    private boolean success;
    private String url;
    private String error;

    public PaymentResponseDto(boolean success, String url) {
        this.success = success;
        this.url = url;
        this.error = null;
    }

    public PaymentResponseDto(boolean success, String url, String error) {
        this.success = success;
        this.url = url;
        this.error = error;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
