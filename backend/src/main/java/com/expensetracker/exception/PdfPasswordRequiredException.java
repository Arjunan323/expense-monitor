package com.expensetracker.exception;

/**
 * Thrown when a PDF statement requires a password or an incorrect password was supplied.
 */
public class PdfPasswordRequiredException extends RuntimeException {
    public PdfPasswordRequiredException(String message) {
        super(message);
    }
}
