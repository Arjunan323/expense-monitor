package com.expensetracker.dto;

import java.math.BigDecimal;
import java.util.List;

public class MonthlyTrendResponseDto {
    public static class MonthValue {
        private String month; // yyyy-MM
        private BigDecimal inflow;
        private BigDecimal outflow; // negative not required; store absolute
        private BigDecimal net;     // inflow - outflow
        public MonthValue(){}
        public MonthValue(String month, BigDecimal inflow, BigDecimal outflow, BigDecimal net){this.month=month;this.inflow=inflow;this.outflow=outflow;this.net=net;}
        public String getMonth(){return month;}
        public void setMonth(String month){this.month=month;}
        public BigDecimal getInflow(){return inflow;}
        public void setInflow(BigDecimal inflow){this.inflow=inflow;}
        public BigDecimal getOutflow(){return outflow;}
        public void setOutflow(BigDecimal outflow){this.outflow=outflow;}
        public BigDecimal getNet(){return net;}
        public void setNet(BigDecimal net){this.net=net;}
    }

    private List<MonthValue> data;
    private String currency;
    public MonthlyTrendResponseDto(){}
    public MonthlyTrendResponseDto(List<MonthValue> data, String currency){this.data=data; this.currency=currency;}
    public List<MonthValue> getData(){return data;}
    public void setData(List<MonthValue> data){this.data=data;}
    public String getCurrency(){return currency;}
    public void setCurrency(String currency){this.currency=currency;}
}