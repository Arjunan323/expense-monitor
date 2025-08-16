package com.expensetracker.dto;

public class RegisterResponseDto {
    private boolean success;
    private String message;
    private String token;
    private UserDto user;

    public RegisterResponseDto(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public RegisterResponseDto(boolean success, String message, String token, UserDto user) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.user = user;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
}
