package com.expensetracker.service;

import com.expensetracker.dto.TrendPointDto;
import com.expensetracker.dto.MonthlySpendingDtos;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.security.AuthenticationFacade;
import com.expensetracker.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
@Transactional(readOnly = true)
public class TrendService {
    private final TransactionRepository txRepo;
    private final AuthenticationFacade auth;
    public TrendService(TransactionRepository txRepo, AuthenticationFacade auth){this.txRepo=txRepo;this.auth=auth;}

    public List<TrendPointDto> monthlyNet(int months){
        if(months<=0) months = 6;
        User u = auth.currentUser();
        YearMonth now = YearMonth.now();
        YearMonth fromYm = now.minusMonths(months-1);
        LocalDate start = fromYm.atDay(1);
        LocalDate end = now.atEndOfMonth();
        var projections = txRepo.aggregateMonthly(u,start,end);
        var map = projections.stream().collect(Collectors.toMap(p->p.getYm(), p->p.getNet()));
        List<TrendPointDto> result = new ArrayList<>();
        for(int i=0;i<months;i++){
            YearMonth ym = fromYm.plusMonths(i);
            String key = ym.toString();
            BigDecimal net = map.getOrDefault(key, BigDecimal.ZERO);
            result.add(new TrendPointDto(key, net));
        }
        return result;
    }

    // Advanced monthly spending series (outflow/inflow/category/bank + summary)
    public MonthlySpendingDtos.MonthlySeriesResponse monthlySpendingSeries(YearMonth fromYm, YearMonth toYm, List<String> bankFilter, boolean includeBanks, boolean includePrevYear, int topCategories){
        if(fromYm.isAfter(toYm)) throw new IllegalArgumentException("from after to");
        User u = auth.currentUser();
        LocalDate start = fromYm.atDay(1);
        LocalDate end = toYm.atEndOfMonth();
        if(bankFilter != null && bankFilter.isEmpty()) bankFilter = null; // normalize empty -> null
        var flowProjections = txRepo.aggregateMonthlyFlows(u,start,end, bankFilter);
        var catProj = txRepo.aggregateMonthlyCategoryOutflow(u,start,end, bankFilter);
        java.util.List<TransactionRepository.MonthlyBankOutflowProjection> bankProj = includeBanks ? txRepo.aggregateMonthlyBankOutflow(u,start,end, bankFilter) : java.util.Collections.emptyList();

        // Build index maps
        var flowMap = flowProjections.stream().collect(Collectors.toMap(TransactionRepository.MonthlyFlowProjection::getYm, p->p));
        var catGrouped = catProj.stream().collect(Collectors.groupingBy(TransactionRepository.MonthlyCategoryOutflowProjection::getYm));
        java.util.Map<String, List<TransactionRepository.MonthlyBankOutflowProjection>> bankGrouped = new java.util.HashMap<>();
        if(includeBanks){
            for(TransactionRepository.MonthlyBankOutflowProjection p : bankProj){
                bankGrouped.computeIfAbsent(p.getYm(), k -> new java.util.ArrayList<>()).add(p);
            }
        }

        // Previous year baseline if requested
        var prevYearMap = new java.util.HashMap<String, BigDecimal>();
        if(includePrevYear){
            LocalDate prevStart = start.minusYears(1);
            LocalDate prevEnd = end.minusYears(1);
            txRepo.aggregateMonthlyFlows(u, prevStart, prevEnd, bankFilter).forEach(p -> prevYearMap.put(p.getYm(), p.getOutflow()));
        }

        List<MonthlySpendingDtos.MonthlyPoint> monthly = new ArrayList<>();
        YearMonth cursor = fromYm;
        BigDecimal highest = null, lowest = null, sum = BigDecimal.ZERO;
        String highestMonth = null, lowestMonth = null;
        while(!cursor.isAfter(toYm)){
            String ymKey = cursor.toString();
            var flow = flowMap.get(ymKey);
            BigDecimal inflow = flow!=null? flow.getInflow(): BigDecimal.ZERO;
            BigDecimal outflow = flow!=null? flow.getOutflow(): BigDecimal.ZERO;
            BigDecimal net = inflow.subtract(outflow);

            var catList = catGrouped.getOrDefault(ymKey, List.of()).stream()
                    .sorted((a,b)-> b.getOutflow().compareTo(a.getOutflow()))
                    .limit(topCategories>0? topCategories: 5)
                    .map(p -> new MonthlySpendingDtos.CategoryAmount(p.getCategory(), p.getOutflow(), BigDecimal.ZERO, null, null))
                    .collect(Collectors.toList());

        List<MonthlySpendingDtos.BankAmount> bankList = includeBanks ? bankGrouped.getOrDefault(ymKey, List.of()).stream()
            .map(p -> new MonthlySpendingDtos.BankAmount(p.getBankName(), p.getOutflow()))
            .collect(Collectors.toList()) : List.of();

            BigDecimal prevYearOutflow = includePrevYear? prevYearMap.getOrDefault(cursor.minusYears(1).toString(), null) : null;
            BigDecimal yoyChange = (prevYearOutflow!=null && prevYearOutflow.signum()!=0)?
                    outflow.subtract(prevYearOutflow).multiply(BigDecimal.valueOf(100)).divide(prevYearOutflow, 2, java.math.RoundingMode.HALF_UP): null;

            monthly.add(new MonthlySpendingDtos.MonthlyPoint(ymKey, outflow, inflow, net, catList, bankList, prevYearOutflow, yoyChange));

            if(highest==null || outflow.compareTo(highest)>0){ highest = outflow; highestMonth = ymKey; }
            if(lowest==null || outflow.compareTo(lowest)<0){ lowest = outflow; lowestMonth = ymKey; }
            sum = sum.add(outflow);
            cursor = cursor.plusMonths(1);
        }
        BigDecimal avg = monthly.isEmpty()? BigDecimal.ZERO : sum.divide(BigDecimal.valueOf(monthly.size()),2, java.math.RoundingMode.HALF_UP);
        // momChangePct: compare last vs previous
        BigDecimal momChangePct = null;
        if(monthly.size()>=2){
            BigDecimal last = monthly.get(monthly.size()-1).totalOutflow();
            BigDecimal prev = monthly.get(monthly.size()-2).totalOutflow();
            if(prev.signum()!=0){
                momChangePct = last.subtract(prev).multiply(BigDecimal.valueOf(100)).divide(prev,2, java.math.RoundingMode.HALF_UP);
            }
        }
        var summary = new MonthlySpendingDtos.Summary(
                new MonthlySpendingDtos.SummaryStat(highestMonth, highest!=null? highest: BigDecimal.ZERO),
                new MonthlySpendingDtos.SummaryStat(lowestMonth, lowest!=null? lowest: BigDecimal.ZERO),
                avg, momChangePct);
        return new MonthlySpendingDtos.MonthlySeriesResponse(fromYm.toString(), toYm.toString(), summary, monthly, auth.currentUser().getCurrency());
    }

    public MonthlySpendingDtos.MonthBreakdownResponse monthBreakdown(YearMonth ym, List<String> bankFilter, boolean includeBanks){
        User u = auth.currentUser();
        LocalDate start = ym.atDay(1); LocalDate end = ym.atEndOfMonth();
        if(bankFilter != null && bankFilter.isEmpty()) bankFilter = null;
        TransactionRepository.MonthlyFlowProjection flow = txRepo.aggregateMonthlyFlows(u,start,end, bankFilter).stream().findFirst().orElse(null);
        BigDecimal inflow = flow!=null? flow.getInflow(): BigDecimal.ZERO;
        BigDecimal outflow = flow!=null? flow.getOutflow(): BigDecimal.ZERO;
        BigDecimal net = inflow.subtract(outflow);
        var cats = txRepo.categoryBreakdownForMonth(u,start,end, bankFilter).stream()
                .map(p -> new MonthlySpendingDtos.CategoryAmount(p.getCategory(), p.getOutflow(), p.getInflow(), null, null))
                .collect(Collectors.toList());
        List<MonthlySpendingDtos.BankAmount> banks = includeBanks ? txRepo.bankBreakdownForMonth(u,start,end, bankFilter).stream()
        .map(p -> new MonthlySpendingDtos.BankAmount(p.getBankName(), p.getOutflow()))
        .collect(Collectors.toList()) : List.of();
        return new MonthlySpendingDtos.MonthBreakdownResponse(ym.toString(), outflow, inflow, net, cats, banks, u.getCurrency());
    }
}