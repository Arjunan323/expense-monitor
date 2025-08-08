package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.expensetracker.dto.DashboardStatsDto;
import com.expensetracker.service.DashboardService;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    @Autowired
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardStatsDto> getSummary(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        DashboardStatsDto stats = dashboardService.getSummary(token);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportCsv(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String csv = dashboardService.exportCsv(token);
        return ResponseEntity.ok(csv);
    }
}
