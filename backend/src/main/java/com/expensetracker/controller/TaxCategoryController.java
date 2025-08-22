package com.expensetracker.controller;

import com.expensetracker.dto.TaxCategoryDto;
import com.expensetracker.service.TaxCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/analytics/tax-categories")
public class TaxCategoryController {
    private final TaxCategoryService service;
    public TaxCategoryController(TaxCategoryService service){this.service=service;}

    @GetMapping public List<TaxCategoryDto> list(){return service.list();}
    @PostMapping public ResponseEntity<TaxCategoryDto> create(@RequestBody TaxCategoryDto dto){return ResponseEntity.ok(service.create(dto));}
    @PutMapping("/{id}") public TaxCategoryDto update(@PathVariable Long id, @RequestBody TaxCategoryDto dto){return service.update(id,dto);}    
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){service.delete(id); return ResponseEntity.noContent().build();}
}