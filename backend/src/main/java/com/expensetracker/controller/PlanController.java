package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.expensetracker.repository.PlanRepository;
import com.expensetracker.model.Plan;
import java.util.List;

@RestController
@RequestMapping("/plans")
public class PlanController {
    @Autowired
    private PlanRepository planRepository;

    @GetMapping
    public List<Plan> getPlans(@RequestParam(value = "region", required = false) String region,
                               @RequestParam(value = "billingPeriod", required = false) String billingPeriod) {
        if (region == null || region.isEmpty()) region = "IN";
        if (billingPeriod != null && !billingPeriod.isBlank()) {
            return planRepository.findByRegionAndBillingPeriod(region, billingPeriod.toUpperCase());
        }
        return planRepository.findByRegion(region);
    }
}
