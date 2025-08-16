package com.expensetracker.controller;

import com.expensetracker.dto.AnalyticsSummaryDto;
import com.expensetracker.service.AnalyticsService;
import com.expensetracker.service.CurrencyFormatService;
import com.expensetracker.security.AuthenticationFacade;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {
    @Autowired private AnalyticsService analyticsService;
    @Autowired private CurrencyFormatService currencyFormatService;
    @Autowired private AuthenticationFacade authenticationFacade;

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryDto> getAnalyticsSummary(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate) {
        String token = authHeader.replace("Bearer ", "");
    AnalyticsSummaryDto summary = analyticsService.getSummary(token, startDate, endDate);
    currencyFormatService.formatAnalytics(authenticationFacade.currentUser(), summary);
        return ResponseEntity.ok(summary);
    }
}
