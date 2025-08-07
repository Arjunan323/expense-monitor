package com.expensetracker.dto;

public class AuthResponseDto {
    private String token;
    private UserDto user;
    private String error;

    public AuthResponseDto() { }

    public AuthResponseDto(String token, UserDto user) {
        this.token = token;
        this.user = user;
        this.error = null;
    }

    public AuthResponseDto(String token, UserDto user, String error) {
        this.token = token;
        this.user = user;
        this.error = error;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
