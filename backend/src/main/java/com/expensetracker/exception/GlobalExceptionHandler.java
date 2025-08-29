package com.expensetracker.exception;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.slf4j.MDC;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        private ErrorResponse build(HttpStatus status, String message, String code, String path, List<String> details) {
                String correlationId = MDC.get("correlationId");
                if (correlationId != null) {
                        if (details == null || details.isEmpty()) {
                                details = List.of("correlationId=" + correlationId);
                        } else {
                                details.add("correlationId=" + correlationId);
                        }
                }
                return new ErrorResponse(status.value(), status.getReasonPhrase(), message, path, code,
                                (details == null || details.isEmpty()) ? null : details);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(build(HttpStatus.NOT_FOUND, ex.getMessage(), "NOT_FOUND", req.getRequestURI(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleBodyValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage()).collect(Collectors.toList());
        return ResponseEntity.badRequest()
                .body(build(HttpStatus.BAD_REQUEST, "Validation failed", "VALIDATION_ERROR", req.getRequestURI(), details));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex, HttpServletRequest req) {
        List<String> details = ex.getConstraintViolations().stream().map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.toList());
        return ResponseEntity.badRequest()
                .body(build(HttpStatus.BAD_REQUEST, "Constraint violation", "CONSTRAINT_VIOLATION", req.getRequestURI(), details));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
        String msg = "Parameter '" + ex.getName() + "' has invalid value '" + ex.getValue() + "'";
        return ResponseEntity.badRequest()
                .body(build(HttpStatus.BAD_REQUEST, msg, "TYPE_MISMATCH", req.getRequestURI(), null));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest req) {
        log.warn("Data integrity violation", ex);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(build(HttpStatus.CONFLICT, "Data integrity violation", "DATA_CONFLICT", req.getRequestURI(), null));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(build(HttpStatus.FORBIDDEN, "Access denied", "FORBIDDEN", req.getRequestURI(), null));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuth(AuthenticationException ex, HttpServletRequest req) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(build(HttpStatus.UNAUTHORIZED, "Authentication failed", "UNAUTHORIZED", req.getRequestURI(), null));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest req) {
        return ResponseEntity.badRequest()
                .body(build(HttpStatus.BAD_REQUEST, ex.getMessage(), "BAD_REQUEST", req.getRequestURI(), null));
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUsernameNotFound(UsernameNotFoundException ex, HttpServletRequest req) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(build(HttpStatus.NOT_FOUND, ex.getMessage(), "USER_NOT_FOUND", req.getRequestURI(), null));
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUserExists(UserAlreadyExistsException ex, HttpServletRequest req) {
            // reference to class ensures import isn't optimized away
            return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(build(HttpStatus.CONFLICT, ex.getMessage(), "USER_EXISTS", req.getRequestURI(), null));
    }
    
        @ExceptionHandler(PdfPasswordRequiredException.class)
        public ResponseEntity<ErrorResponse> handlePdfPassword(PdfPasswordRequiredException ex, HttpServletRequest req) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(build(HttpStatus.BAD_REQUEST, ex.getMessage(), "PDF_PASSWORD_REQUIRED", req.getRequestURI(), new java.util.ArrayList<>(java.util.List.of("passwordRequired=true"))));
        }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(build(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected error occurred", "INTERNAL_ERROR", req.getRequestURI(), null));
    }

        @ExceptionHandler(FeatureLockedException.class)
        public ResponseEntity<ErrorResponse> handleFeatureLocked(FeatureLockedException ex, HttpServletRequest req) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(build(HttpStatus.FORBIDDEN, ex.getMessage(), "FEATURE_LOCKED", req.getRequestURI(), null));
        }
}
