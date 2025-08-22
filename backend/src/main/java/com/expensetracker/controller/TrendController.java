package com.expensetracker.controller;

import com.expensetracker.dto.TrendPointDto;
import com.expensetracker.dto.MonthlySpendingDtos;
import com.expensetracker.service.TrendService;
import org.springframework.web.bind.annotation.*;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/analytics/trends")
public class TrendController {
    private final TrendService service;
    public TrendController(TrendService service){this.service=service;}

    @GetMapping("/monthly") public List<TrendPointDto> monthly(@RequestParam(defaultValue = "6") int months){return service.monthlyNet(months);}    

    @GetMapping("/spending/monthly-series")
    public MonthlySpendingDtos.MonthlySeriesResponse spendingSeries(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) List<String> banks,
            @RequestParam(defaultValue = "false") boolean includeBanks,
            @RequestParam(defaultValue = "false") boolean includePrevYear,
            @RequestParam(defaultValue = "5") int topCategories){
        return service.monthlySpendingSeries(parseYm(from), parseYm(to), banks, includeBanks, includePrevYear, topCategories);
    }

    @GetMapping("/spending/monthly/{ym}")
    public MonthlySpendingDtos.MonthBreakdownResponse spendingBreakdown(@PathVariable("ym") String ym,
            @RequestParam(required = false) List<String> banks,
            @RequestParam(defaultValue = "false") boolean includeBanks){
        return service.monthBreakdown(parseYm(ym), banks, includeBanks);
    }

    private YearMonth parseYm(String val){
        // Accept yyyy-MM or yyyy-MM-dd ; truncate after 7 chars if longer
        if(val == null) throw new IllegalArgumentException("Missing YearMonth value");
        if(val.length() >= 7) {
            val = val.substring(0,7);
        }
        return YearMonth.parse(val);
    }
}