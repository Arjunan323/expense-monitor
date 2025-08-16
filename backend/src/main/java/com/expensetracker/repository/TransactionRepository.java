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
import java.util.Set;

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

    @Query("select concat(function('YEAR', t.date), '-', lpad(function('MONTH', t.date),2,'0')) as ym, SUM(t.amount) as net " +
            "from Transaction t where t.user = :user and t.date between :start and :end group by function('YEAR', t.date), function('MONTH', t.date) order by ym")
    List<MonthlyNetProjection> aggregateMonthly(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select COALESCE(SUM(case when t.amount > 0 then t.amount else 0 end),0) from Transaction t where t.user = :user and t.date between :start and :end")
    java.math.BigDecimal sumInflow(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select COALESCE(SUM(case when t.amount < 0 then t.amount else 0 end),0) from Transaction t where t.user = :user and t.date between :start and :end")
    java.math.BigDecimal sumOutflow(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("select t.txnHash from Transaction t where t.user = :user and t.txnHash in :hashes")
    Set<String> findExistingHashes(@Param("user") User user, @Param("hashes") Set<String> hashes);
}
