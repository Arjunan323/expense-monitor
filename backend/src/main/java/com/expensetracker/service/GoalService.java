package com.expensetracker.service;

import com.expensetracker.dto.GoalDto;
import com.expensetracker.dto.GoalStatsDto;
import com.expensetracker.model.Goal;
import com.expensetracker.model.User;
import com.expensetracker.repository.GoalRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class GoalService {
	private final GoalRepository repo; private final UserRepository userRepo; private final ForecastCache forecastCache;
	public GoalService(GoalRepository r, UserRepository u, ForecastCache forecastCache){this.repo=r; this.userRepo=u; this.forecastCache=forecastCache;}

	private GoalDto toDto(Goal g){
		GoalDto d=new GoalDto(); d.setId(g.getId()); d.setTitle(g.getTitle()); d.setDescription(g.getDescription());
		d.setTargetAmount(g.getTargetAmount()); d.setCurrentAmount(g.getCurrentAmount()); d.setTargetDate(g.getTargetDate());
		d.setCategory(g.getCategory()); d.setIcon(g.getIcon()); d.setColor(g.getColor()); d.setMonthlyContribution(g.getMonthlyContribution()); return d; }
	private void updateEntity(Goal g, GoalDto d){ g.setTitle(d.getTitle()); g.setDescription(d.getDescription()); g.setTargetAmount(d.getTargetAmount());
		if(d.getCurrentAmount()!=null) g.setCurrentAmount(d.getCurrentAmount()); g.setTargetDate(d.getTargetDate()); g.setCategory(d.getCategory());
		g.setIcon(d.getIcon()); g.setColor(d.getColor()); g.setMonthlyContribution(d.getMonthlyContribution()); }

	private User currentUser(){ // placeholder; integrate with security later
		return userRepo.findById(1L).orElseThrow();
	}

	public List<GoalDto> list(){ User u=currentUser(); return repo.findByUser(u).stream().map(this::toDto).collect(Collectors.toList()); }
	public GoalDto create(GoalDto dto){ User u=currentUser(); Goal g=new Goal(); updateEntity(g,dto); g.setUser(u); Goal saved=repo.save(g); forecastCache.invalidateUser(u.getId()); return toDto(saved); }
	public GoalDto update(Long id, GoalDto dto){ User u=currentUser(); Goal g=repo.findByIdAndUser(id,u).orElseThrow(); updateEntity(g,dto); forecastCache.invalidateUser(u.getId()); return toDto(g); }
	public void delete(Long id){ User u=currentUser(); Goal g=repo.findByIdAndUser(id,u).orElseThrow(); repo.delete(g); forecastCache.invalidateUser(u.getId()); }
	// Deprecated aggregation & range methods removed; stats() + list() suffice.

	public GoalDto contribute(Long id, BigDecimal amount, BigDecimal newMonthlyContribution){
		User u=currentUser(); Goal g=repo.findByIdAndUser(id,u).orElseThrow();
		if(amount!=null){
			BigDecimal updated = g.getCurrentAmount().add(amount);
			// Cap at targetAmount if target defined
			if(g.getTargetAmount()!=null && updated.compareTo(g.getTargetAmount())>0){
				updated = g.getTargetAmount();
			}
			g.setCurrentAmount(updated);
		}
		if(newMonthlyContribution!=null){ g.setMonthlyContribution(newMonthlyContribution); }
		forecastCache.invalidateUser(u.getId());
		return toDto(g);
	}

	public GoalStatsDto stats(){
		User u=currentUser(); List<Goal> goals = repo.findByUser(u); int total = goals.size();
		int completed = (int) goals.stream().filter(g -> g.getCurrentAmount()!=null && g.getTargetAmount()!=null && g.getCurrentAmount().compareTo(g.getTargetAmount())>=0).count();
		int active = total - completed;
		BigDecimal totalSaved = goals.stream().map(g-> g.getCurrentAmount()==null?BigDecimal.ZERO:g.getCurrentAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal monthlyTarget = goals.stream().map(g-> g.getMonthlyContribution()==null?BigDecimal.ZERO:g.getMonthlyContribution()).reduce(BigDecimal.ZERO, BigDecimal::add);
		BigDecimal avgProgress = BigDecimal.ZERO;
		if(total>0){
			BigDecimal sumPerc = goals.stream()
					.filter(g -> g.getTargetAmount()!=null && g.getTargetAmount().compareTo(BigDecimal.ZERO)>0)
					.map(g -> g.getCurrentAmount()==null?BigDecimal.ZERO: g.getCurrentAmount().multiply(BigDecimal.valueOf(100)).divide(g.getTargetAmount(), 2, java.math.RoundingMode.HALF_UP))
					.reduce(BigDecimal.ZERO, BigDecimal::add);
			avgProgress = sumPerc.divide(BigDecimal.valueOf(total), 2, java.math.RoundingMode.HALF_UP);
		}
		GoalStatsDto s = new GoalStatsDto(); s.setTotalGoals(total); s.setActiveGoals(active); s.setCompletedGoals(completed);
		s.setTotalSaved(totalSaved); s.setMonthlyTarget(monthlyTarget); s.setAverageProgressPercent(avgProgress); return s;
	}
}

