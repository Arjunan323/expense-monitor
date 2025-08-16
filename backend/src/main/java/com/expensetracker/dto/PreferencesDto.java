package com.expensetracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PreferencesDto {
    @NotBlank
    @Size(max = 6)
    // Basic ISO currency code pattern; can refine later
    @Pattern(regexp = "[A-Z]{3,6}")
    private String currency;

    @NotBlank
    @Size(max = 10)
    // Locale like en-US, fr-FR
    @Pattern(regexp = "[a-z]{2}(-[A-Z]{2})?")
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
