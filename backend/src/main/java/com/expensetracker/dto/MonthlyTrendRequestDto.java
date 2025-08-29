package com.expensetracker.dto;

import java.time.LocalDate;

/** Request parameters for computing monthly trends. */
public class MonthlyTrendRequestDto {
    private LocalDate start; // inclusive
    private LocalDate end;   // inclusive
    private Integer limit;   // max months to return (optional)

    public LocalDate getStart() { return start; }
    public void setStart(LocalDate start) { this.start = start; }
    public LocalDate getEnd() { return end; }
    public void setEnd(LocalDate end) { this.end = end; }
    public Integer getLimit() { return limit; }
    public void setLimit(Integer limit) { this.limit = limit; }
}