package com.expensetracker.controller;

import com.expensetracker.dto.BudgetCategoryDto;
import com.expensetracker.dto.BudgetSummaryResponse;
import java.math.BigDecimal;
import com.expensetracker.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * REST endpoints for budget category CRUD.
 */
import com.expensetracker.security.RequiresPlan;
import com.expensetracker.security.PlanTier;

@RestController
@RequestMapping("/analytics/budgets")
@RequiresPlan(level = PlanTier.PRO)
public class BudgetController {
	private final BudgetService service;
	public BudgetController(BudgetService s){this.service=s;}

	@GetMapping public List<BudgetCategoryDto> list(){return service.list();}

	/**
	 * Composite summary used by BudgetTracking UI (categories + totals + history KPIs).
	 */
	@GetMapping("/summary") public BudgetSummaryResponse summary(@RequestParam(value = "month", required = false) String month){
		return service.summary(month);
	}
	@PostMapping public ResponseEntity<BudgetCategoryDto> create(@RequestBody @Valid BudgetCategoryDto dto){return ResponseEntity.ok(service.create(dto));}
	@PutMapping("/{id}") public BudgetCategoryDto update(@PathVariable Long id, @RequestBody @Valid BudgetCategoryDto dto){return service.update(id,dto);}    
	@DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){service.delete(id); return ResponseEntity.noContent().build();}

	/** Quick inline limit edit (PATCH semantics). */
	@PatchMapping("/{id}/limit") public BudgetCategoryDto updateLimit(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body){
		Object v = body.get("monthlyBudget");
		if(v==null) throw new IllegalArgumentException("monthlyBudget required");
		BigDecimal newLimit = new BigDecimal(v.toString());
		return service.updateLimit(id, newLimit);
	}
}

