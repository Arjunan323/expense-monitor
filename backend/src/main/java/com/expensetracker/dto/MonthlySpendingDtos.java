package com.expensetracker.dto;

import java.math.BigDecimal;
import java.util.List;

public class MonthlySpendingDtos {
    public record CategoryAmount(String category, BigDecimal outflow, BigDecimal inflow, BigDecimal yoyChangePct, BigDecimal momChangePct) {}
    public record BankAmount(String bank, BigDecimal outflow) {}
    public record MonthlyPoint(String month, BigDecimal totalOutflow, BigDecimal inflow, BigDecimal net,
                               List<CategoryAmount> categories, List<BankAmount> banks,
                               BigDecimal prevYearOutflow, BigDecimal yoyChangePct) {}
    public record SummaryStat(String month, BigDecimal amount) {}
    public record Summary(SummaryStat highest, SummaryStat lowest, BigDecimal averageOutflow, BigDecimal momChangePct) {}
    public record MonthlySeriesResponse(String from, String to, Summary summary, List<MonthlyPoint> monthly, String currency) {}
    public record MonthBreakdownResponse(String month, BigDecimal totalOutflow, BigDecimal inflow, BigDecimal net,
                                         List<CategoryAmount> categories, List<BankAmount> banks, String currency) {}
}
