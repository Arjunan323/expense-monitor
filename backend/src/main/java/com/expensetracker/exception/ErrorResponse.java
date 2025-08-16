package com.expensetracker.exception;

import java.time.Instant;
import java.util.List;

public class ErrorResponse {
    private Instant timestamp = Instant.now();
    private int status;
    private String error;
    private String message;
    private String path;
    private String code;
    private List<String> details;

    public ErrorResponse() {}

    public ErrorResponse(int status, String error, String message, String path, String code, List<String> details) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
        this.code = code;
        this.details = details;
    }

    public Instant getTimestamp() { return timestamp; }
    public int getStatus() { return status; }
    public String getError() { return error; }
    public String getMessage() { return message; }
    public String getPath() { return path; }
    public String getCode() { return code; }
    public List<String> getDetails() { return details; }

    public void setStatus(int status) { this.status = status; }
    public void setError(String error) { this.error = error; }
    public void setMessage(String message) { this.message = message; }
    public void setPath(String path) { this.path = path; }
    public void setCode(String code) { this.code = code; }
    public void setDetails(List<String> details) { this.details = details; }
}
