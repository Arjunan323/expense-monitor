package com.expensetracker.service;

import com.expensetracker.dto.MonthlyTrendRequestDto;
import com.expensetracker.dto.MonthlyTrendResponseDto;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.security.AuthenticationFacade;
import com.expensetracker.model.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
@Transactional(readOnly = true)
public class MonthlyTrendService {
    private final TransactionRepository repo; private final AuthenticationFacade auth;
    public MonthlyTrendService(TransactionRepository repo, AuthenticationFacade auth){this.repo=repo;this.auth=auth;}

    public MonthlyTrendResponseDto compute(MonthlyTrendRequestDto req){
        User u = auth.currentUser();
        LocalDate start = req.getStart()!=null? req.getStart() : YearMonth.now().minusMonths(5).atDay(1);
        LocalDate end = req.getEnd()!=null? req.getEnd() : YearMonth.now().atEndOfMonth();
    var flows = repo.aggregateMonthlyFlows(u,start,end, null);
        Map<String, TransactionRepository.MonthlyFlowProjection> map = flows.stream().collect(Collectors.toMap(TransactionRepository.MonthlyFlowProjection::getYm, f->f));
        List<MonthlyTrendResponseDto.MonthValue> mv = new ArrayList<>();
        YearMonth fromYm = YearMonth.from(start);
        YearMonth toYm = YearMonth.from(end);
        int max = 0;
        while(!fromYm.isAfter(toYm)){
            var key = fromYm.toString();
            var p = map.get(key);
            BigDecimal inflow = p!=null? p.getInflow(): BigDecimal.ZERO;
            BigDecimal outflow = p!=null? p.getOutflow(): BigDecimal.ZERO;
            BigDecimal net = inflow.subtract(outflow);
            mv.add(new MonthlyTrendResponseDto.MonthValue(key,inflow,outflow,net));
            fromYm = fromYm.plusMonths(1);
            if(req.getLimit()!=null && ++max>=req.getLimit()) break;
        }
        return new MonthlyTrendResponseDto(mv, u.getCurrency());
    }
}