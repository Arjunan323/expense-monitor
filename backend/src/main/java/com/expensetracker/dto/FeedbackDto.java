package com.expensetracker.dto;

public class FeedbackDto {
    private String email;
    private String message;
    private String type; // GENERAL or ANALYTICS
    private String meta; // JSON string (optional)

    public FeedbackDto() {}
    public FeedbackDto(String email, String message, String type, String meta) {
        this.email = email;
        this.message = message;
        this.type = type;
        this.meta = meta;
    }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getMeta() { return meta; }
    public void setMeta(String meta) { this.meta = meta; }
}
