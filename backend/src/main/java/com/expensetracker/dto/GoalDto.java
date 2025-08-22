package com.expensetracker.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public class GoalDto {
    private Long id;
    @NotBlank @Size(max=120)
    private String title;
    @Size(max=500)
    private String description;
    @NotNull @DecimalMin(value="0.01")
    private BigDecimal targetAmount;
    @DecimalMin(value="0.0")
    private BigDecimal currentAmount;
    @FutureOrPresent
    private LocalDate targetDate;
    @NotBlank
    private String category;
    @Size(max=64)
    private String icon;
    @Size(max=32)
    private String color;
    @DecimalMin(value="0.0")
    private BigDecimal monthlyContribution;
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
}
