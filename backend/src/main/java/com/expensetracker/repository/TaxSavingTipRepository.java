package com.expensetracker.repository;

import com.expensetracker.model.TaxSavingTip;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaxSavingTipRepository extends JpaRepository<TaxSavingTip, Long> {
}
