package com.expensetracker.repository;

import com.expensetracker.model.TaxCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TaxCategoryRepository extends JpaRepository<TaxCategory, Long> {
    Optional<TaxCategory> findByCode(String code);
}