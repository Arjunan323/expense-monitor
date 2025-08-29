package com.expensetracker.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "goal")
public class Goal {
	@Id @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	private String title;
	private String description;
	@Column(precision = 19, scale = 4)
	private BigDecimal targetAmount;
	@Column(precision = 19, scale = 4)
	private BigDecimal currentAmount;
	private LocalDate targetDate;
	private String category; // savings | debt | investment
	private String icon;
	private String color;
	@Column(precision = 19, scale = 4)
	private BigDecimal monthlyContribution;
	@ManyToOne @JoinColumn(name = "user_id")
	private User user;
	private LocalDateTime createdAt; private LocalDateTime updatedAt;
	@PrePersist public void prePersist(){createdAt=updatedAt=LocalDateTime.now(); if(currentAmount==null) currentAmount=BigDecimal.ZERO;}
	@PreUpdate public void preUpdate(){updatedAt=LocalDateTime.now();}
	public Long getId(){return id;} public void setId(Long id){this.id=id;}
	public String getTitle(){return title;} public void setTitle(String title){this.title=title;}
	public String getDescription(){return description;} public void setDescription(String description){this.description=description;}
	public BigDecimal getTargetAmount(){return targetAmount;} public void setTargetAmount(BigDecimal targetAmount){this.targetAmount=targetAmount;}
	public BigDecimal getCurrentAmount(){return currentAmount;} public void setCurrentAmount(BigDecimal currentAmount){this.currentAmount=currentAmount;}
	public LocalDate getTargetDate(){return targetDate;} public void setTargetDate(LocalDate targetDate){this.targetDate=targetDate;}
	public String getCategory(){return category;} public void setCategory(String category){this.category=category;}
	public String getIcon(){return icon;} public void setIcon(String icon){this.icon=icon;}
	public String getColor(){return color;} public void setColor(String color){this.color=color;}
	public BigDecimal getMonthlyContribution(){return monthlyContribution;} public void setMonthlyContribution(BigDecimal monthlyContribution){this.monthlyContribution=monthlyContribution;}
	public User getUser(){return user;} public void setUser(User user){this.user=user;}
	public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime createdAt){this.createdAt=createdAt;}
	public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime updatedAt){this.updatedAt=updatedAt;}
}

