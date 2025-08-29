package com.expensetracker.controller;

import com.expensetracker.dto.UpcomingTransactionDto;
import com.expensetracker.service.UpcomingTransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/upcoming-transactions")
public class UpcomingTransactionController {
	private final UpcomingTransactionService service;
	public UpcomingTransactionController(UpcomingTransactionService service){this.service=service;}

	@GetMapping public List<UpcomingTransactionDto> list(@RequestParam(required = false) String start, @RequestParam(required = false) String end){
        LocalDate s = start!=null? LocalDate.parse(start): null;
        LocalDate e = end!=null? LocalDate.parse(end): null;
        return service.list(s,e);
    }
	@PostMapping public ResponseEntity<UpcomingTransactionDto> create(@RequestBody UpcomingTransactionDto dto){return ResponseEntity.ok(service.create(dto));}
	@PutMapping("/{id}") public UpcomingTransactionDto update(@PathVariable Long id, @RequestBody UpcomingTransactionDto dto){return service.update(id,dto);}    
	@DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){service.delete(id); return ResponseEntity.noContent().build();}
}