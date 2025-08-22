package com.expensetracker.repository;

import com.expensetracker.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.stream.Stream;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
    @Query("select t from Transaction t where t.user = :user and (:start is null or t.date >= :start) and (:end is null or t.date <= :end)")
    List<Transaction> findByUserAndDateRange(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select t from Transaction t where t.user = :user")
    Stream<Transaction> streamByUser(@Param("user") User user);

    // Projections for analytics to avoid loading full entities
    interface CategorySpendProjection {
        String getCategory();
    java.math.BigDecimal getTotalAmount();
        Long getTxnCount();
    }

    interface MonthlyNetProjection {
        String getYm();
    java.math.BigDecimal getNet();
    }

    @Query("select t.category as category, SUM(t.amount) as totalAmount, COUNT(t.id) as txnCount " +
            "from Transaction t where t.user = :user and t.date between :start and :end group by t.category")
    List<CategorySpendProjection> aggregateCategory(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select function('TO_CHAR', t.date, 'YYYY-MM') as ym, SUM(t.amount) as net " +
            "from Transaction t where t.user = :user and t.date between :start and :end group by function('TO_CHAR', t.date, 'YYYY-MM') order by ym")
    List<MonthlyNetProjection> aggregateMonthly(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select COALESCE(SUM(case when t.amount > 0 then t.amount else 0 end),0) from Transaction t where t.user = :user and t.date between :start and :end")
    java.math.BigDecimal sumInflow(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select COALESCE(SUM(case when t.amount < 0 then t.amount else 0 end),0) from Transaction t where t.user = :user and t.date between :start and :end")
    java.math.BigDecimal sumOutflow(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);

    interface MonthlyFlowProjection { String getYm(); java.math.BigDecimal getInflow(); java.math.BigDecimal getOutflow(); }
    @Query("select function('TO_CHAR', t.date, 'YYYY-MM') as ym, " +
        "COALESCE(SUM(case when t.amount > 0 then t.amount else 0 end),0) as inflow, " +
        "COALESCE(ABS(SUM(case when t.amount < 0 then t.amount else 0 end)),0) as outflow " +
        "from Transaction t where t.user = :user and t.date between :start and :end " +
        "and (:banks is null or t.bankName in :banks) " +
        "group by function('TO_CHAR', t.date, 'YYYY-MM') order by ym")
    List<MonthlyFlowProjection> aggregateMonthlyFlows(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end, @Param("banks") List<String> banks);

    // Monthly category outflow (absolute) per category
    interface MonthlyCategoryOutflowProjection { String getYm(); String getCategory(); java.math.BigDecimal getOutflow(); }
    @Query("select function('TO_CHAR', t.date, 'YYYY-MM') as ym, coalesce(t.category,'UNCATEGORIZED') as category, " +
        "COALESCE(ABS(SUM(case when t.amount < 0 then t.amount else 0 end)),0) as outflow " +
        "from Transaction t where t.user = :user and t.date between :start and :end " +
        "and (:banks is null or t.bankName in :banks) " +
        "group by function('TO_CHAR', t.date, 'YYYY-MM'), coalesce(t.category,'UNCATEGORIZED')")
    List<MonthlyCategoryOutflowProjection> aggregateMonthlyCategoryOutflow(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end, @Param("banks") List<String> banks);

    // Monthly bank outflow (absolute) per bank
    interface MonthlyBankOutflowProjection { String getYm(); String getBankName(); java.math.BigDecimal getOutflow(); }
    @Query("select function('TO_CHAR', t.date, 'YYYY-MM') as ym, coalesce(t.bankName,'UNKNOWN') as bankName, " +
        "COALESCE(ABS(SUM(case when t.amount < 0 then t.amount else 0 end)),0) as outflow " +
        "from Transaction t where t.user = :user and t.date between :start and :end " +
        "and (:banks is null or t.bankName in :banks) " +
        "group by function('TO_CHAR', t.date, 'YYYY-MM'), coalesce(t.bankName,'UNKNOWN')")
    List<MonthlyBankOutflowProjection> aggregateMonthlyBankOutflow(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end, @Param("banks") List<String> banks);

    // Category breakdown for a single month
    interface CategoryBreakdownProjection { String getCategory(); java.math.BigDecimal getOutflow(); java.math.BigDecimal getInflow(); }
    @Query("select coalesce(t.category,'UNCATEGORIZED') as category, " +
        "COALESCE(ABS(SUM(case when t.amount < 0 then t.amount else 0 end)),0) as outflow, " +
        "COALESCE(SUM(case when t.amount > 0 then t.amount else 0 end),0) as inflow " +
        "from Transaction t where t.user = :user and t.date between :start and :end " +
        "and (:banks is null or t.bankName in :banks) group by coalesce(t.category,'UNCATEGORIZED')")
    List<CategoryBreakdownProjection> categoryBreakdownForMonth(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end, @Param("banks") List<String> banks);

    // Bank breakdown for a single month
    interface BankBreakdownProjection { String getBankName(); java.math.BigDecimal getOutflow(); }
    @Query("select coalesce(t.bankName,'UNKNOWN') as bankName, COALESCE(ABS(SUM(case when t.amount < 0 then t.amount else 0 end)),0) as outflow " +
        "from Transaction t where t.user = :user and t.date between :start and :end " +
        "and (:banks is null or t.bankName in :banks) group by coalesce(t.bankName,'UNKNOWN')")
    List<BankBreakdownProjection> bankBreakdownForMonth(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end, @Param("banks") List<String> banks);

    @Query("select t from Transaction t where t.merchant is null or trim(t.merchant) = ''")
    org.springframework.data.domain.Page<Transaction> findUnnormalized(org.springframework.data.domain.Pageable pageable);
}
