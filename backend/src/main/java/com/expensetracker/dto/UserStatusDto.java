package com.expensetracker.dto;

public class UserStatusDto {
    private boolean subscribed;
    private String planType;
    private String status;
    private String error;

    public UserStatusDto(boolean subscribed, String planType, String status) {
        this.subscribed = subscribed;
        this.planType = planType;
        this.status = status;
        this.error = null;
    }

    public UserStatusDto(boolean subscribed) {
        this.subscribed = subscribed;
        this.planType = null;
        this.status = null;
        this.error = null;
    }

    public UserStatusDto(String error) {
        this.subscribed = false;
        this.planType = null;
        this.status = null;
        this.error = error;
    }

    public boolean isSubscribed() { return subscribed; }
    public void setSubscribed(boolean subscribed) { this.subscribed = subscribed; }
    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
