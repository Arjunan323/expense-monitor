package com.expensetracker.dto;

public class UserStatusDto {
    private boolean subscribed;
    private String error;

    public UserStatusDto(boolean subscribed) {
        this.subscribed = subscribed;
        this.error = null;
    }

    public UserStatusDto(String error) {
        this.subscribed = false;
        this.error = error;
    }

    public boolean isSubscribed() { return subscribed; }
    public void setSubscribed(boolean subscribed) { this.subscribed = subscribed; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
