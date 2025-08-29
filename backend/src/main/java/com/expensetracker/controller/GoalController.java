package com.expensetracker.controller;

import com.expensetracker.dto.GoalDto;
import com.expensetracker.dto.GoalContributionRequest;
import com.expensetracker.dto.GoalStatsDto;
import com.expensetracker.service.GoalService;
import com.expensetracker.security.RequiresPlan;
import com.expensetracker.security.PlanTier;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/analytics/goals")
@RequiresPlan(level = PlanTier.PREMIUM)
public class GoalController {
	private final GoalService service; public GoalController(GoalService s){this.service=s;}
	@GetMapping public List<GoalDto> list(){return service.list();}
	@PostMapping public ResponseEntity<GoalDto> create(@RequestBody @Valid GoalDto dto){return ResponseEntity.ok(service.create(dto));}
	@PutMapping("/{id}") public GoalDto update(@PathVariable Long id, @RequestBody @Valid GoalDto dto){return service.update(id,dto);}
	@DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){service.delete(id); return ResponseEntity.noContent().build();}
	// Removed deprecated /progress/total and /range endpoints; stats + list cover these use cases

	@PatchMapping("/{id}/contribution")
	public GoalDto contribute(@PathVariable Long id, @RequestBody @Valid GoalContributionRequest req){
		return service.contribute(id, req.getAmount(), req.getMonthlyContribution());
	}

	@GetMapping("/stats")
	public GoalStatsDto stats(){ return service.stats(); }
}

