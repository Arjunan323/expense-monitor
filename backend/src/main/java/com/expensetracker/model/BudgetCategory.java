package com.expensetracker.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Persistent budget category with cached spent value for current month (optional pre-aggregation).
 */
@Entity
@Table(name = "budget_category")
public class BudgetCategory {
	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	private String name;
	@Column(precision = 19, scale = 4)
	private BigDecimal monthlyBudget;
	@Column(precision = 19, scale = 4)
	private BigDecimal spent; // may be null -> treat as 0
	private String icon;
	private String color;
	@ManyToOne @JoinColumn(name = "user_id")
	private User user;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	@PrePersist public void prePersist(){createdAt=updatedAt=LocalDateTime.now(); if(spent==null) spent=BigDecimal.ZERO;}
	@PreUpdate public void preUpdate(){updatedAt=LocalDateTime.now();}

	// getters / setters
	public Long getId(){return id;} public void setId(Long id){this.id=id;}
	public String getName(){return name;} public void setName(String name){this.name=name;}
	public BigDecimal getMonthlyBudget(){return monthlyBudget;} public void setMonthlyBudget(BigDecimal monthlyBudget){this.monthlyBudget=monthlyBudget;}
	public BigDecimal getSpent(){return spent;} public void setSpent(BigDecimal spent){this.spent=spent;}
	public String getIcon(){return icon;} public void setIcon(String icon){this.icon=icon;}
	public String getColor(){return color;} public void setColor(String color){this.color=color;}
	public User getUser(){return user;} public void setUser(User user){this.user=user;}
	public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime createdAt){this.createdAt=createdAt;}
	public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime updatedAt){this.updatedAt=updatedAt;}
}

