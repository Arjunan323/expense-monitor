package com.expensetracker.controller;

import com.expensetracker.dto.*;
import com.expensetracker.service.MonthlyTrendService;
import com.expensetracker.service.CashFlowForecastService;
import org.springframework.web.bind.annotation.*;
import com.expensetracker.security.RequiresPlan;
import com.expensetracker.security.PlanTier;

@RestController
@RequestMapping("/analytics")
public class AnalyticsExtrasController {
    private final MonthlyTrendService monthlyTrendService; private final CashFlowForecastService cashFlowForecastService;
    public AnalyticsExtrasController(MonthlyTrendService m, CashFlowForecastService c){this.monthlyTrendService=m; this.cashFlowForecastService=c;}

    @PostMapping("/monthly-trend/detailed")
    @RequiresPlan(level = PlanTier.PREMIUM)
    public MonthlyTrendResponseDto monthlyTrend(@RequestBody MonthlyTrendRequestDto req){ return monthlyTrendService.compute(req); }

    @GetMapping("/cashflow-forecast")
    @RequiresPlan(level = PlanTier.PREMIUM)
    public CashFlowForecastDto cashFlowForecast(@RequestParam(defaultValue = "3") int months){ return cashFlowForecastService.forecast(months); }

    @GetMapping("/excel/template-info")
    @RequiresPlan(level = PlanTier.PREMIUM)
    public ExcelTemplateInfoDto templateInfo(){
        return new ExcelTemplateInfoDto(
                "transactions-import-v1",
                "/static/templates/transactions-import-v1.xlsx",
                java.util.List.of("date","description","amount","category","bank"),
                java.util.List.of("notes","reference","currency"),
                "1.0.0"
        );
    }
}