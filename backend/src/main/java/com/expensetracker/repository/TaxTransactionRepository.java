package com.expensetracker.repository;

import com.expensetracker.model.TaxTransaction;
import com.expensetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaxTransactionRepository extends JpaRepository<TaxTransaction, Long> {
    List<TaxTransaction> findByUser(User user);
    List<TaxTransaction> findByUserAndTaxYear(User user, Integer taxYear);
    @Query("select (count(t)>0) from TaxTransaction t where t.user = :user and t.sourceTransaction.id = :txId")
    boolean existsByUserAndSourceTransactionId(@Param("user") User user, @Param("txId") Long txId);

    @Query("select t from TaxTransaction t where t.user = :user and t.classificationStatus = 'SUGGESTED'")
    List<TaxTransaction> findSuggested(@Param("user") User user);
    @Query("select t from TaxTransaction t where t.user = :user and t.classificationStatus = 'SUGGESTED'")
    org.springframework.data.domain.Page<TaxTransaction> pageSuggested(@Param("user") User user, org.springframework.data.domain.Pageable pageable);

    @Query("select t.taxYear as year, COALESCE(sum(t.amount),0) as total from TaxTransaction t where t.user = :user group by t.taxYear order by t.taxYear desc")
    List<TaxYearTotal> aggregateYearTotals(@Param("user") User user);

    @Query("select t.category as category, COALESCE(sum(t.amount),0) as total from TaxTransaction t where t.user = :user and (:year is null or t.taxYear = :year) and (t.deductible = true or t.deductible is null) group by t.category")
    List<CategoryTotal> aggregateCategoryTotals(@Param("user") User user, @Param("year") Integer year);

    @Query("select COALESCE(sum(t.amount),0) from TaxTransaction t where t.user = :user and (:year is null or t.taxYear = :year) and (t.deductible = true or t.deductible is null)")
    java.math.BigDecimal totalDeductible(@Param("user") User user, @Param("year") Integer year);

    @Query("select count(t) from TaxTransaction t where t.user = :user and (:year is null or t.taxYear = :year) and (t.deductible = true or t.deductible is null) and (t.hasReceipt = false or t.hasReceipt is null)")
    long countMissingReceipts(@Param("user") User user, @Param("year") Integer year);

    interface TaxYearTotal { Integer getYear(); java.math.BigDecimal getTotal(); }
    interface CategoryTotal { String getCategory(); java.math.BigDecimal getTotal(); }
}