package com.expensetracker.service;

import com.expensetracker.dto.BudgetCategoryDto;
import com.expensetracker.dto.BudgetCategoryUsageDto;
import com.expensetracker.dto.BudgetSummaryResponse;
import com.expensetracker.model.BudgetCategory;
import com.expensetracker.model.User;
import com.expensetracker.repository.BudgetCategoryRepository;
import com.expensetracker.security.AuthenticationFacade;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for CRUD operations on budget categories.
 */
@Service
@Transactional
public class BudgetService {
	private final BudgetCategoryRepository repo;
	private final AuthenticationFacade auth;
    private final com.expensetracker.repository.TransactionRepository txnRepo;
	public BudgetService(BudgetCategoryRepository repo, AuthenticationFacade auth, com.expensetracker.repository.TransactionRepository txnRepo){this.repo=repo;this.auth=auth; this.txnRepo = txnRepo;}

	public List<BudgetCategoryDto> list(){
		User u = auth.currentUser();
		return repo.findByUser(u).stream().map(this::toDto).collect(Collectors.toList());
	}

	public BudgetCategoryDto create(@Valid BudgetCategoryDto dto){
		User u = auth.currentUser();
		BudgetCategory bc = new BudgetCategory();
		bc.setName(dto.name());
		bc.setMonthlyBudget(dto.monthlyBudget());
		bc.setSpent(dto.spent());
		bc.setIcon(dto.icon());
		bc.setColor(dto.color());
		bc.setUser(u);
		return toDto(repo.save(bc));
	}

	public BudgetCategoryDto update(Long id, @Valid BudgetCategoryDto dto){
		User u = auth.currentUser();
		BudgetCategory bc = repo.findByIdAndUser(id,u).orElseThrow();
		bc.setName(dto.name());
		bc.setMonthlyBudget(dto.monthlyBudget());
		bc.setIcon(dto.icon());
		bc.setColor(dto.color());
		return toDto(bc);
	}

	public void delete(Long id){
		User u = auth.currentUser();
		BudgetCategory bc = repo.findByIdAndUser(id,u).orElseThrow();
		repo.delete(bc);
	}

	/** Patch only the monthly budget (quick edit). */
	public BudgetCategoryDto updateLimit(Long id, java.math.BigDecimal newLimit){
		User u = auth.currentUser();
		BudgetCategory bc = repo.findByIdAndUser(id,u).orElseThrow();
		bc.setMonthlyBudget(newLimit);
		return toDto(bc);
	}

	/** Build summary for a given month (YYYY-MM or null for current). */
	public BudgetSummaryResponse summary(String monthStr){
		java.time.YearMonth ym = (monthStr==null || monthStr.isBlank()) ? java.time.YearMonth.now() : java.time.YearMonth.parse(monthStr);
		User u = auth.currentUser();
		java.time.LocalDate start = ym.atDay(1);
		java.time.LocalDate end = ym.atEndOfMonth();

		// Fetch budgets
		var budgets = repo.findByUser(u);
		java.util.Map<String, java.math.BigDecimal> spentMap = new java.util.HashMap<>();
		// Use existing projection for current month category breakdown
		var breakdown = txnRepo.categoryBreakdownForMonth(u, start, end, null);
		breakdown.forEach(p -> spentMap.put(p.getCategory(), p.getOutflow()));

		java.util.List<BudgetCategoryUsageDto> categories = new java.util.ArrayList<>();
		java.math.BigDecimal totalBudget = java.math.BigDecimal.ZERO;
		java.math.BigDecimal totalSpent = java.math.BigDecimal.ZERO;
		int overBudgetCount = 0;
		for(var b : budgets){
			java.math.BigDecimal spent = spentMap.getOrDefault(b.getName(), java.math.BigDecimal.ZERO);
			// ensure spent field optionally cached updated (non-transactional semantics fine here)
			b.setSpent(spent);
			java.math.BigDecimal budget = b.getMonthlyBudget();
			if(budget==null) budget = java.math.BigDecimal.ZERO;
			double progress = budget.signum()==0 ? 0d : spent.divide(budget, java.math.MathContext.DECIMAL64).doubleValue()*100d;
			boolean over = spent.compareTo(budget) > 0;
			boolean near = !over && progress >= 80d;
			if(over) overBudgetCount++;
			totalBudget = totalBudget.add(budget);
			totalSpent = totalSpent.add(spent);
			java.math.BigDecimal remaining = budget.subtract(spent);
			if(remaining.signum()<0) remaining = java.math.BigDecimal.ZERO;
			categories.add(new BudgetCategoryUsageDto(
					b.getId(), b.getName(), budget, spent, b.getIcon(), b.getColor(),
					Math.min(progress, 100d), over, near, remaining
			));
		}
		double overallProgress = totalBudget.signum()==0 ? 0d : totalSpent.divide(totalBudget, java.math.MathContext.DECIMAL64).doubleValue()*100d;

		// History / adherence metrics (current, last, avg 6 months)
		double thisAdh = adherenceForMonth(u, ym, budgets, spentMap);
		double lastAdh = adherenceForMonth(u, ym.minusMonths(1), budgets, null);
		double avg6 = averageAdherence(u, ym, budgets, 6);

		return new BudgetSummaryResponse(
				ym.toString(),
				categories,
				new BudgetSummaryResponse.Totals(totalBudget, totalSpent, overBudgetCount, overallProgress),
				new BudgetSummaryResponse.History(thisAdh, lastAdh, avg6)
		);
	}

	private double adherenceForMonth(User u, java.time.YearMonth ym, java.util.List<BudgetCategory> budgets, java.util.Map<String, java.math.BigDecimal> precomputed){
		if(budgets.isEmpty()) return 0d;
		java.time.LocalDate s = ym.atDay(1); java.time.LocalDate e = ym.atEndOfMonth();
		java.util.Map<String, java.math.BigDecimal> map = precomputed!=null ? precomputed : new java.util.HashMap<>();
		if(precomputed==null){
			var breakdown = txnRepo.categoryBreakdownForMonth(u, s, e, null);
			breakdown.forEach(p -> map.put(p.getCategory(), p.getOutflow()));
		}
		java.math.BigDecimal numer = java.math.BigDecimal.ZERO; // sum of min(spent, budget)
		java.math.BigDecimal denom = java.math.BigDecimal.ZERO; // sum of budgets
		for(var b : budgets){
			java.math.BigDecimal budget = b.getMonthlyBudget(); if(budget==null) continue; if(budget.signum()<=0) continue;
			java.math.BigDecimal spent = map.getOrDefault(b.getName(), java.math.BigDecimal.ZERO);
			denom = denom.add(budget);
			numer = numer.add(spent.min(budget));
		}
		if(denom.signum()==0) return 0d;
		return numer.divide(denom, java.math.MathContext.DECIMAL64).doubleValue()*100d;
	}

	private double averageAdherence(User u, java.time.YearMonth endInclusive, java.util.List<BudgetCategory> budgets, int months){
		if(months<=0) return 0d;
		double sum=0d; int count=0;
		for(int i=0;i<months;i++){
			var ym = endInclusive.minusMonths(i);
			sum += adherenceForMonth(u, ym, budgets, null);
			count++;
		}
		return count==0?0d: sum / count;
	}

	private BudgetCategoryDto toDto(BudgetCategory e){
		return new BudgetCategoryDto(e.getId(), e.getName(), e.getMonthlyBudget(), e.getSpent(), e.getIcon(), e.getColor());
	}
}

