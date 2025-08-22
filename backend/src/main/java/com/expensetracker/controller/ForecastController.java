package com.expensetracker.controller;

import com.expensetracker.dto.ForecastDto;
import com.expensetracker.service.ForecastService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/analytics/forecast")
public class ForecastController {
    private final ForecastService service;
    public ForecastController(ForecastService service){this.service=service;}

    @GetMapping public ForecastDto forecast(@RequestParam(defaultValue = "3") int months){return service.forecast(months);}    
}