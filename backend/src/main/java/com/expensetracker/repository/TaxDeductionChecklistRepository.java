package com.expensetracker.repository;

import com.expensetracker.model.TaxDeductionChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaxDeductionChecklistRepository extends JpaRepository<TaxDeductionChecklistItem, Long> {
}
