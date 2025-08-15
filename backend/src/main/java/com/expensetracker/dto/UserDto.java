package com.expensetracker.dto;

public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String locale;
    private String currency;

    public UserDto(Long id, String username, String email, String locale, String currency) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.locale = locale;
        this.currency = currency;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
