package com.expensetracker.dto;

public class UsageStatsDto {
    private int statementsThisMonth;
    private int statementLimit;
    private String planType;
    private int pagesThisMonth;
    private int pageLimit;
    private boolean canUpload;
    private Integer combinedBankLimit;

    public UsageStatsDto() {}

    public UsageStatsDto(int statementsThisMonth, int statementLimit, String planType, int pagesThisMonth, int pageLimit, boolean canUpload, Integer combinedBankLimit) {
        this.statementsThisMonth = statementsThisMonth;
        this.statementLimit = statementLimit;
        this.planType = planType;
        this.pagesThisMonth = pagesThisMonth;
        this.pageLimit = pageLimit;
        this.canUpload = canUpload;
        this.combinedBankLimit = combinedBankLimit;
    }

    public int getStatementsThisMonth() { return statementsThisMonth; }
    public void setStatementsThisMonth(int statementsThisMonth) { this.statementsThisMonth = statementsThisMonth; }
    public int getStatementLimit() { return statementLimit; }
    public void setStatementLimit(int statementLimit) { this.statementLimit = statementLimit; }
    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }
    public int getPagesThisMonth() { return pagesThisMonth; }
    public void setPagesThisMonth(int pagesThisMonth) { this.pagesThisMonth = pagesThisMonth; }
    public int getPageLimit() { return pageLimit; }
    public void setPageLimit(int pageLimit) { this.pageLimit = pageLimit; }
    public boolean isCanUpload() { return canUpload; }
    public void setCanUpload(boolean canUpload) { this.canUpload = canUpload; }
    public Integer getCombinedBankLimit() { return combinedBankLimit; }
    public void setCombinedBankLimit(Integer combinedBankLimit) { this.combinedBankLimit = combinedBankLimit; }
}
