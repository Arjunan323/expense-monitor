package com.expensetracker.service;

import com.expensetracker.dto.ForecastDto;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UpcomingTransactionRepository;
import com.expensetracker.security.AuthenticationFacade;
import com.expensetracker.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.math.BigDecimal;

@Service
@Transactional(readOnly = true)
public class ForecastService {
    private final TransactionRepository txRepo;
    private final UpcomingTransactionRepository upcomingRepo;
    private final AuthenticationFacade auth;
    private final ForecastCache cache;
    private final EmailNotificationService emailNotificationService;
    @org.springframework.beans.factory.annotation.Value("${app.mail.low-balance.enabled:true}") private boolean lowBalanceEmailsEnabled;
    public ForecastService(TransactionRepository txRepo, UpcomingTransactionRepository upcomingRepo, AuthenticationFacade auth, ForecastCache cache, EmailNotificationService emailNotificationService){this.txRepo=txRepo;this.upcomingRepo=upcomingRepo;this.auth=auth; this.cache=cache; this.emailNotificationService = emailNotificationService;}

    public ForecastDto forecast(int futureMonths){
    if(futureMonths<=0) futureMonths=3;
        int historyMonths = Math.max(futureMonths*2, 6);
        User u = auth.currentUser();
    ForecastDto cached = cache.get(u.getId(), futureMonths);
    if(cached!=null) return cached;
        YearMonth now = YearMonth.now();
        YearMonth fromYm = now.minusMonths(historyMonths-1);
        LocalDate start = fromYm.atDay(1);
        LocalDate end = now.atEndOfMonth();
        var list = txRepo.aggregateMonthly(u,start,end);
        // Sort actuals by month
        var sorted = list.stream().sorted(Comparator.comparing(com.expensetracker.repository.TransactionRepository.MonthlyNetProjection::getYm)).toList();
        List<ForecastDto.MonthProjection> actuals = new ArrayList<>();
        List<BigDecimal> nets = new ArrayList<>();
        for(var p : sorted){
            BigDecimal net = p.getNet()==null? BigDecimal.ZERO : p.getNet();
            nets.add(net);
            actuals.add(new ForecastDto.MonthProjection(p.getYm(), net));
        }
        BigDecimal avg = nets.isEmpty()? BigDecimal.ZERO : nets.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(nets.size()), java.math.RoundingMode.HALF_UP);
        List<ForecastDto.MonthProjection> projections = new ArrayList<>();
        // Pre-compute upcoming transactions within forecast window (exclude past & current month remainder)
        LocalDate upcomingStart = now.atEndOfMonth().plusDays(1); // start from next month day1 effectively
        LocalDate upcomingEnd = now.plusMonths(futureMonths).atEndOfMonth();
        var upcoming = upcomingRepo.findByUserAndDueDateBetweenOrderByDueDateAsc(u, upcomingStart, upcomingEnd);
        java.util.Map<YearMonth, BigDecimal> upcomingTotals = new java.util.HashMap<>();
        for(var ut : upcoming){
            YearMonth ym = YearMonth.from(ut.getDueDate());
            BigDecimal amt = ut.getAmount()==null? BigDecimal.ZERO : ut.getAmount();
            if(Boolean.TRUE.equals(ut.isRecurring())){
                // Apply to all months from its due date month through window end
                YearMonth cursor = ym;
                YearMonth last = now.plusMonths(futureMonths);
                while(!cursor.isAfter(last)){
                    upcomingTotals.merge(cursor, amt, BigDecimal::add);
                    cursor = cursor.plusMonths(1);
                }
            } else {
                upcomingTotals.merge(ym, amt, BigDecimal::add);
            }
        }
        for(int i=1;i<=futureMonths;i++){
            YearMonth ym = now.plusMonths(i);
            BigDecimal base = avg;
            BigDecimal adj = upcomingTotals.getOrDefault(ym, BigDecimal.ZERO);
            projections.add(new ForecastDto.MonthProjection(ym.toString(), base.add(adj)));
        }
        BigDecimal lastMonthNet = nets.isEmpty()? BigDecimal.ZERO : nets.get(nets.size()-1);
        BigDecimal projectedPeriodTotal = projections.stream().map(ForecastDto.MonthProjection::getProjectedNet).reduce(BigDecimal.ZERO, BigDecimal::add);
        ForecastDto.Summary summary = new ForecastDto.Summary(avg, lastMonthNet, projections.isEmpty()? BigDecimal.ZERO : projections.get(0).getProjectedNet(), projectedPeriodTotal, nets.size(), futureMonths);
        ForecastDto dto = new ForecastDto(actuals, projections, "SIMPLE_AVERAGE", summary);
        cache.put(u.getId(), futureMonths, dto);
        // Low balance email check for next month only (first projection)
        if(lowBalanceEmailsEnabled && !projections.isEmpty()){
            try {
                java.time.YearMonth next = java.time.YearMonth.parse(projections.get(0).getMonth());
                emailNotificationService.maybeSendLowBalance(u, next, projections.get(0).getProjectedNet(), null);
            } catch(Exception ignored) {}
        }
        return dto;
    }
}