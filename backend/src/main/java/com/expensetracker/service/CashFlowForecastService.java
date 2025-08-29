package com.expensetracker.service;

import com.expensetracker.dto.CashFlowForecastDto;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.security.AuthenticationFacade;
import com.expensetracker.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;

@Service
@Transactional(readOnly = true)
public class CashFlowForecastService {
    private final TransactionRepository repo; private final AuthenticationFacade auth;
    public CashFlowForecastService(TransactionRepository repo, AuthenticationFacade auth){this.repo=repo;this.auth=auth;}

    public CashFlowForecastDto forecast(int futureMonths){
        if(futureMonths<=0) futureMonths=3;
        int historyMonths = Math.max(futureMonths*2, 6);
        User u = auth.currentUser();
        YearMonth now = YearMonth.now();
        YearMonth fromYm = now.minusMonths(historyMonths-1);
        LocalDate start = fromYm.atDay(1); LocalDate end = now.atEndOfMonth();
    var flows = repo.aggregateMonthlyFlows(u,start,end, null);
        // simple averages
        BigDecimal avgIn = BigDecimal.ZERO; BigDecimal avgOut = BigDecimal.ZERO; int count=0;
        for(var f : flows){ avgIn = avgIn.add(f.getInflow()); avgOut = avgOut.add(f.getOutflow()); count++; }
        if(count>0){ avgIn = avgIn.divide(BigDecimal.valueOf(count), java.math.RoundingMode.HALF_UP); avgOut = avgOut.divide(BigDecimal.valueOf(count), java.math.RoundingMode.HALF_UP);}        
        List<CashFlowForecastDto.MonthCashFlow> months = new ArrayList<>();
        for(int i=1;i<=futureMonths;i++){
            YearMonth ym = now.plusMonths(i);
            months.add(new CashFlowForecastDto.MonthCashFlow(ym.toString(), avgIn, avgOut));
        }
        return new CashFlowForecastDto(months, "SIMPLE_AVERAGE", u.getCurrency(), "Based on average of last "+count+" months");
    }
}