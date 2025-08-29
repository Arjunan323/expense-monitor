package com.expensetracker.service;

import com.expensetracker.dto.ForecastDto;
import com.expensetracker.model.User;
import com.expensetracker.model.UpcomingTransaction;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UpcomingTransactionRepository;
import com.expensetracker.security.AuthenticationFacade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ForecastServiceTest {
    TransactionRepository txRepo = mock(TransactionRepository.class);
    UpcomingTransactionRepository upcomingRepo = mock(UpcomingTransactionRepository.class);
    AuthenticationFacade auth = mock(AuthenticationFacade.class);
    ForecastCache cache = new ForecastCache();
    ForecastService service;
    EmailNotificationService emailNotificationService = mock(EmailNotificationService.class);
    User user;

    interface MNP extends TransactionRepository.MonthlyNetProjection {}

    private TransactionRepository.MonthlyNetProjection mnp(String ym, BigDecimal net){
        return new TransactionRepository.MonthlyNetProjection(){
            public String getYm(){return ym;} public BigDecimal getNet(){return net;}
        };
    }

    @BeforeEach void setup(){
        service = new ForecastService(txRepo, upcomingRepo, auth, cache, emailNotificationService);
        user = new User(); user.setId(1L); when(auth.currentUser()).thenReturn(user);
        cache.invalidateUser(1L);
    }

    @Test void simpleAverageForecast(){
        YearMonth now = YearMonth.now();
        // Provide 6 months history nets: 10,20,30,40,50,60 => avg 35
        List<TransactionRepository.MonthlyNetProjection> history = List.of(
                mnp(now.minusMonths(5).toString(), BigDecimal.TEN),
                mnp(now.minusMonths(4).toString(), BigDecimal.valueOf(20)),
                mnp(now.minusMonths(3).toString(), BigDecimal.valueOf(30)),
                mnp(now.minusMonths(2).toString(), BigDecimal.valueOf(40)),
                mnp(now.minusMonths(1).toString(), BigDecimal.valueOf(50)),
                mnp(now.toString(), BigDecimal.valueOf(60))
        );
        when(txRepo.aggregateMonthly(eq(user), any(), any())).thenReturn(history);
        when(upcomingRepo.findByUserAndDueDateBetweenOrderByDueDateAsc(eq(user), any(), any())).thenReturn(List.of());
        ForecastDto dto = service.forecast(3);
        assertEquals(6, dto.getActuals().size());
        assertEquals(BigDecimal.valueOf(35), dto.getSummary().getAverageNet());
        assertEquals(3, dto.getProjections().size());
        dto.getProjections().forEach(p -> assertEquals(BigDecimal.valueOf(35), p.getProjectedNet()));
    }

    @Test void upcomingTransactionsAdjustProjection(){
        YearMonth now = YearMonth.now();
        List<TransactionRepository.MonthlyNetProjection> history = List.of(
                mnp(now.minusMonths(2).toString(), BigDecimal.valueOf(100)),
                mnp(now.minusMonths(1).toString(), BigDecimal.valueOf(100)),
                mnp(now.toString(), BigDecimal.valueOf(100))
        );
        when(txRepo.aggregateMonthly(eq(user), any(), any())).thenReturn(history);
        UpcomingTransaction ut = new UpcomingTransaction();
        ut.setAmount(BigDecimal.valueOf(50)); ut.setDueDate(now.plusMonths(1).atDay(10)); ut.setUser(user);
        when(upcomingRepo.findByUserAndDueDateBetweenOrderByDueDateAsc(eq(user), any(), any())).thenReturn(List.of(ut));
        ForecastDto dto = service.forecast(2);
        // avg = 100
        assertEquals(BigDecimal.valueOf(150), dto.getProjections().get(0).getProjectedNet()); // first month includes +50
        assertEquals(BigDecimal.valueOf(100), dto.getProjections().get(1).getProjectedNet()); // second month no change
    }
}
