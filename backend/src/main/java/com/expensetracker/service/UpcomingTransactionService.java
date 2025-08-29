package com.expensetracker.service;

import com.expensetracker.dto.UpcomingTransactionDto;
import com.expensetracker.model.UpcomingTransaction;
import com.expensetracker.model.User;
import com.expensetracker.repository.UpcomingTransactionRepository;
import com.expensetracker.security.AuthenticationFacade;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDate;
import java.util.stream.Collectors;

@Service
@Transactional
public class UpcomingTransactionService {
    private final UpcomingTransactionRepository repo;
    private final AuthenticationFacade auth;
    private final ForecastCache forecastCache;
    public UpcomingTransactionService(UpcomingTransactionRepository repo, AuthenticationFacade auth, ForecastCache forecastCache){this.repo=repo;this.auth=auth; this.forecastCache=forecastCache;}

    public List<UpcomingTransactionDto> list(LocalDate start, LocalDate end){
        User u = auth.currentUser();
        List<UpcomingTransaction> list;
        if(start!=null && end!=null){
            list = repo.findByUserAndDueDateBetweenOrderByDueDateAsc(u,start,end);
        } else {
            list = repo.findByUserOrderByDueDateAsc(u);
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public UpcomingTransactionDto create(UpcomingTransactionDto dto){
        User u = auth.currentUser();
        UpcomingTransaction ut = new UpcomingTransaction();
        ut.setUser(u);
        ut.setDueDate(dto.dueDate());
        ut.setDescription(dto.description());
        ut.setAmount(dto.amount());
        ut.setCategory(dto.category());
        ut.setStatus(dto.status());
    if(dto.recurring()!=null) ut.setRecurring(dto.recurring());
    if(dto.flowType()!=null) ut.setFlowType(dto.flowType()); else ut.setFlowType(dto.amount()!=null && dto.amount().compareTo(java.math.BigDecimal.ZERO)>=0 ? UpcomingTransaction.FlowType.INCOME : UpcomingTransaction.FlowType.EXPENSE);
    UpcomingTransaction saved = repo.save(ut);
    forecastCache.invalidateUser(u.getId());
    return toDto(saved);
    }

    public UpcomingTransactionDto update(Long id, UpcomingTransactionDto dto){
        User u = auth.currentUser();
        UpcomingTransaction ut = repo.findById(id).filter(e->e.getUser().getId().equals(u.getId())).orElseThrow();
        ut.setDueDate(dto.dueDate());
        ut.setDescription(dto.description());
        ut.setAmount(dto.amount());
        ut.setCategory(dto.category());
        ut.setStatus(dto.status());
    if(dto.recurring()!=null) ut.setRecurring(dto.recurring());
    if(dto.flowType()!=null) ut.setFlowType(dto.flowType()); else ut.setFlowType(dto.amount()!=null && dto.amount().compareTo(java.math.BigDecimal.ZERO)>=0 ? UpcomingTransaction.FlowType.INCOME : UpcomingTransaction.FlowType.EXPENSE);
    forecastCache.invalidateUser(u.getId());
    return toDto(ut);
    }

    public void delete(Long id){
        User u = auth.currentUser();
    repo.findById(id).filter(e->e.getUser().getId().equals(u.getId())).ifPresent(e->{ repo.delete(e); forecastCache.invalidateUser(u.getId()); });
    }

    private UpcomingTransactionDto toDto(UpcomingTransaction e){
    return new UpcomingTransactionDto(e.getId(), e.getDueDate(), e.getDescription(), e.getAmount(), e.getCategory(), e.getStatus(), e.isRecurring(), e.getFlowType());
    }
}