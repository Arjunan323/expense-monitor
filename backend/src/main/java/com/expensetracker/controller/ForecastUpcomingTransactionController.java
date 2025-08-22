package com.expensetracker.controller;

import com.expensetracker.dto.UpcomingTransactionDto;
import com.expensetracker.service.UpcomingTransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Alias endpoints for upcoming transactions within the forecast analytics context.
 * This simply delegates to {@link UpcomingTransactionService} but is namespaced under /analytics/forecast.
 */
@RestController
@RequestMapping("/analytics/forecast/upcoming")
public class ForecastUpcomingTransactionController {
    private final UpcomingTransactionService service;
    public ForecastUpcomingTransactionController(UpcomingTransactionService service){this.service=service;}

    @GetMapping
    public List<UpcomingTransactionDto> list(@RequestParam(required = false) String start, @RequestParam(required = false) String end){
        LocalDate s = start!=null? LocalDate.parse(start): null;
        LocalDate e = end!=null? LocalDate.parse(end): null;
        return service.list(s,e);
    }
    @PostMapping
    public ResponseEntity<UpcomingTransactionDto> create(@RequestBody UpcomingTransactionDto dto){
        return ResponseEntity.ok(service.create(dto));
    }
    @PutMapping("/{id}")
    public UpcomingTransactionDto update(@PathVariable Long id, @RequestBody UpcomingTransactionDto dto){
        return service.update(id,dto);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        service.delete(id); return ResponseEntity.noContent().build();
    }
}
