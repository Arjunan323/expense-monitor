package com.expensetracker.service;

import com.expensetracker.dto.TaxCategoryDto;
import com.expensetracker.model.TaxCategory;
import com.expensetracker.repository.TaxCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TaxCategoryService {
    private final TaxCategoryRepository repo;
    public TaxCategoryService(TaxCategoryRepository repo){this.repo=repo;}

    public List<TaxCategoryDto> list(){ return repo.findAll().stream().map(this::toDto).collect(Collectors.toList()); }
    public TaxCategoryDto create(TaxCategoryDto dto){ TaxCategory c = new TaxCategory(); c.setCode(dto.code()); c.setDescription(dto.description()); c.setAnnualLimit(dto.annualLimit()); return toDto(repo.save(c)); }
    public TaxCategoryDto update(Long id, TaxCategoryDto dto){ TaxCategory c = repo.findById(id).orElseThrow(); c.setCode(dto.code()); c.setDescription(dto.description()); c.setAnnualLimit(dto.annualLimit()); return toDto(c); }
    public void delete(Long id){ repo.deleteById(id); }

    private TaxCategoryDto toDto(TaxCategory e){ return new TaxCategoryDto(e.getId(), e.getCode(), e.getDescription(), e.getAnnualLimit()); }
}