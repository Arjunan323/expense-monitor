package com.expensetracker.util;

public class AppConstants {
    public static final String PLAN_FREE = "FREE";
    public static final String PLAN_PRO = "PRO";
    public static final String PLAN_PREMIUM = "PREMIUM";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_FAILED = "FAILED";
    public static final String UNKNOWN = "Unknown";
    public static final String DEFAULT_CURRENCY = "INR";
    public static final String DEFAULT_LOCALE = "en-US";
    public static final String UPGRADE_PROMPT = "Upgrade to Pro or Premium to unlock advanced analytics and multi-bank support.";
    public static final String CSV_HEADER = "date,description,amount,balance,category\n";

    // Razorpay credentials are now externalized via application properties / environment
    public static final String RAZORPAY_KEY_PROP = "payment.razorpay.key";
    public static final String RAZORPAY_SECRET_PROP = "payment.razorpay.secret";
    public static final String REGION_DEFAULT = "USD";
    public static final String EVENT_PAYMENT_CAPTURED = "payment.captured";
    public static final String EVENT_ORDER_PAID = "order.paid";
    public static final String EVENT_PAYMENT_FAILED = "payment.failed";

    public static final int FREE_STATEMENT_LIMIT = 3;
    public static final int FREE_PAGE_LIMIT = 10;
    public static final int PRO_STATEMENT_LIMIT = 5;
    public static final int PRO_PAGE_LIMIT = 50;
    public static final int PREMIUM_STATEMENT_LIMIT = Integer.MAX_VALUE;
    public static final int PREMIUM_PAGE_LIMIT = 100;
    public static final String TEMP_FILE_PREFIX = "statement";
    public static final String TEMP_FILE_SUFFIX = ".pdf";
    public static final String ERROR_EXTRACTION_FAILED = "Extraction failed: ";
    public static final String ERROR_PDF_SAVE = "Error: PDF file not saved correctly";
    public static final String ERROR_PDF_PAGE_COUNT = "Failed to read PDF for page count: ";
    public static final String ERROR_STATEMENT_LIMIT = "You have reached your plan's statement upload limit. Upgrade for more.";
    public static final String ERROR_PAGE_LIMIT = "This statement has %d pages. Your plan allows up to %d pages per statement. Upgrade for more.";
    public static final String ERROR_PROCESSING_STATEMENT = "Error processing statement";
    public static final String ERROR_PARSING_TRANSACTIONS = "Error parsing transactions";
    public static final String MSG_STATEMENT_SUCCESS = "Statement uploaded and transactions saved";
}
