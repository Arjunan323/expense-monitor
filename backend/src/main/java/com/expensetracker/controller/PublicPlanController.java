package com.expensetracker.controller;

import com.expensetracker.model.Plan;
import com.expensetracker.repository.PlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public (unauthenticated) read-only access to plan catalog for marketing / landing page.
 */
@RestController
@RequestMapping("/public/plans")
public class PublicPlanController {

    @Autowired
    private PlanRepository planRepository;

    @GetMapping
    public List<Plan> getPublicPlans(@RequestParam(value = "region", required = false) String region) {
        if (region == null || region.isEmpty()) {
            region = "IN"; // Default region
        }
        return planRepository.findByRegion(region);
    }
}
