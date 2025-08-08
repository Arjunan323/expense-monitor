package com.expensetracker.dto;

import com.expensetracker.model.Subscription;
import java.time.LocalDateTime;

public class SubscriptionStatusDto {
    private String planType;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private int statementsUsed;
    private int statementLimit;
    private int pagesUsed;
    private int pageLimit;
    private boolean canUpload;
    private String upgradeUrl;

    public SubscriptionStatusDto(String planType, LocalDateTime startDate, LocalDateTime endDate, String status, int statementsUsed, int statementLimit, int pagesUsed, int pageLimit, boolean canUpload, String upgradeUrl) {
        this.planType = planType;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.statementsUsed = statementsUsed;
        this.statementLimit = statementLimit;
        this.pagesUsed = pagesUsed;
        this.pageLimit = pageLimit;
        this.canUpload = canUpload;
        this.upgradeUrl = upgradeUrl;
    }

    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getStatementsUsed() { return statementsUsed; }
    public void setStatementsUsed(int statementsUsed) { this.statementsUsed = statementsUsed; }
    public int getStatementLimit() { return statementLimit; }
    public void setStatementLimit(int statementLimit) { this.statementLimit = statementLimit; }
    public int getPagesUsed() { return pagesUsed; }
    public void setPagesUsed(int pagesUsed) { this.pagesUsed = pagesUsed; }
    public int getPageLimit() { return pageLimit; }
    public void setPageLimit(int pageLimit) { this.pageLimit = pageLimit; }
    public boolean isCanUpload() { return canUpload; }
    public void setCanUpload(boolean canUpload) { this.canUpload = canUpload; }
    public String getUpgradeUrl() { return upgradeUrl; }
    public void setUpgradeUrl(String upgradeUrl) { this.upgradeUrl = upgradeUrl; }
}
