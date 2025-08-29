package com.expensetracker.controller;

import com.expensetracker.dto.ForecastDto;
import com.expensetracker.service.ForecastService;
import com.expensetracker.security.RequiresPlan;
import com.expensetracker.security.PlanTier;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/analytics/forecast")
@RequiresPlan(level = PlanTier.PREMIUM)
public class ForecastController {
    private final ForecastService service;
    public ForecastController(ForecastService service){this.service=service;}

    @GetMapping public ForecastDto forecast(@RequestParam(defaultValue = "3") int months){return service.forecast(months);}    
}