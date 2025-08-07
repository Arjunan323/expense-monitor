package com.expensetracker.dto;

public class PreferencesDto {
    private String currency;
    private String locale;

    public PreferencesDto() {}
    public PreferencesDto(String currency, String locale) {
        this.currency = currency;
        this.locale = locale;
    }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getLocale() { return locale; }
    public void setLocale(String locale) { this.locale = locale; }
}
