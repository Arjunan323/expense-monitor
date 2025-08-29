package com.expensetracker.controller;

import com.expensetracker.dto.TaxTransactionDto;
import com.expensetracker.dto.GenericKeyValue;
import com.expensetracker.dto.TaxSummaryDto;
import com.expensetracker.dto.TaxCategoryUsageDto;
import com.expensetracker.dto.TaxInsightDto;
import com.expensetracker.service.TaxService;
import com.expensetracker.service.TaxRuleService;
import com.expensetracker.service.TaxInfoService;
import com.expensetracker.dto.TaxDeductionRuleDto;
import com.expensetracker.dto.TaxRuleTestResultDto;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.expensetracker.security.RequiresPlan;
import com.expensetracker.security.PlanTier;

@RestController
@RequestMapping("/analytics/taxes")
@Tag(name = "Tax Tracking", description = "Endpoints for tax deductible tracking & insights")
@RequiresPlan(level = PlanTier.PREMIUM)
public class TaxController {
    private final TaxService service;
    private final TaxRuleService ruleService;
    private final TaxInfoService infoService;
    public TaxController(TaxService service, TaxRuleService ruleService, TaxInfoService infoService){this.service=service; this.ruleService=ruleService; this.infoService=infoService;}
    @GetMapping("/checklist")
    @Operation(summary = "Get tax deduction checklist")
    public List<com.expensetracker.model.TaxDeductionChecklistItem> getChecklist() { return infoService.getChecklist(); }

    @GetMapping("/tips")
    @Operation(summary = "Get tax saving tips")
    public List<com.expensetracker.model.TaxSavingTip> getTips() { return infoService.getTips(); }

    @GetMapping
    @Operation(summary = "List tax transactions", description = "Returns tax transactions optionally filtered by tax year")
    public List<TaxTransactionDto> list(@Parameter(description = "Tax year, e.g. 2025") @RequestParam(required = false) Integer year){return service.list(year);}    
    @GetMapping("/year-totals")
    @Operation(summary = "Aggregate totals per year")
    public List<GenericKeyValue<Integer, java.math.BigDecimal>> yearTotals(){return service.yearTotals();}

    // ---- Rule management ----
    @GetMapping("/rules")
    @Operation(summary = "List user tax deduction rules")
    public List<TaxDeductionRuleDto> listRules(){ return ruleService.list(); }

    @PostMapping("/rules")
    @Operation(summary = "Create rule")
    public TaxDeductionRuleDto createRule(@RequestBody TaxDeductionRuleDto dto){ return ruleService.create(dto); }

    @PutMapping("/rules/{id}")
    @Operation(summary = "Update rule")
    public TaxDeductionRuleDto updateRule(@PathVariable Long id, @RequestBody TaxDeductionRuleDto dto){ return ruleService.update(id, dto); }

    @DeleteMapping("/rules/{id}")
    @Operation(summary = "Delete rule")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id){ ruleService.delete(id); return ResponseEntity.noContent().build(); }

    @PostMapping("/rules/test")
    @Operation(summary = "Test a potential rule against sample inputs")
    public TaxRuleTestResultDto testRule(@RequestParam String matchType,
                                         @RequestParam String matchValue,
                                         @RequestParam(required=false) String description,
                                         @RequestParam(required=false) java.math.BigDecimal amount,
                                         @RequestParam(required=false) String category,
                                         @RequestParam(required=false) String merchant,
                                         @RequestParam(required=false) String taxCategoryCode,
                                         @RequestParam(required=false) Boolean autoMarkDeductible){
        return ruleService.test(matchType, matchValue, description, amount, category, merchant, taxCategoryCode, autoMarkDeductible);
    }

    @PostMapping("/classify")
    @Operation(summary = "Classify transactions in date range", description = "Applies active rules to outflow transactions and creates tax records")
    public ResponseEntity<GenericKeyValue<String,Integer>> classify(@RequestParam java.time.LocalDate start, @RequestParam java.time.LocalDate end){
        int created = ruleService.classifyRange(start, end);
        return ResponseEntity.ok(new GenericKeyValue<>("created", created));
    }

    @GetMapping("/suggestions")
    @Operation(summary = "List suggested (unapproved) tax transactions")
    public Object suggestions(@RequestParam(required=false) Integer page, @RequestParam(required=false) Integer size){
        if(page!=null || size!=null){
            int p = page!=null? page:0; int s = size!=null? Math.min(size,100): 25;
            return service.suggestionsPaged(p,s);
        }
        return service.suggestions();
    }

    @PostMapping("/suggestions/approve")
    @Operation(summary = "Approve suggested tax transactions")
    public ResponseEntity<GenericKeyValue<String,Integer>> approve(@RequestBody List<Long> ids){
        int cnt = ruleService.approve(ids);
        return ResponseEntity.ok(new GenericKeyValue<>("approved", cnt));
    }

    @PostMapping("/suggestions/reject")
    @Operation(summary = "Reject suggested tax transactions")
    public ResponseEntity<GenericKeyValue<String,Integer>> reject(@RequestBody List<Long> ids){
        int cnt = ruleService.reject(ids);
        return ResponseEntity.ok(new GenericKeyValue<>("rejected", cnt));
    }

    @PostMapping
    @Operation(summary = "Create tax transaction")
    public ResponseEntity<TaxTransactionDto> create(@RequestBody TaxTransactionDto dto){return ResponseEntity.ok(service.create(dto));}

    @PutMapping("/{id}")
    @Operation(summary = "Update tax transaction")
    public TaxTransactionDto update(@PathVariable Long id, @RequestBody TaxTransactionDto dto){return service.update(id,dto);}    

    @GetMapping("/{id}")
    @Operation(summary = "Fetch single tax transaction")
    public TaxTransactionDto get(@PathVariable Long id){ return service.get(id); }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete tax transaction")
    public ResponseEntity<Void> delete(@PathVariable Long id){service.delete(id); return ResponseEntity.noContent().build();}

    @GetMapping("/summary")
    @Operation(summary = "Summary for a year", description = "Returns totals, estimated savings, missing receipts and per-category usage")
    public TaxSummaryDto summary(@RequestParam(required = false) Integer year){return service.summary(year);}    

    @GetMapping("/categories/usage")
    @Operation(summary = "Per-category usage", description = "Returns usage data for each configured tax category")
    public List<TaxCategoryUsageDto> categoryUsage(@RequestParam(required = false) Integer year){return service.summary(year).categories();}

    @GetMapping("/insights")
    @Operation(summary = "Insights & tips", description = "Returns dynamic tips, warnings & actions")
    public List<TaxInsightDto> insights(@RequestParam(required = false) Integer year){return service.insights(year);}    

    @PostMapping("/{id}/toggle-deductible")
    @Operation(summary = "Toggle deductible flag")
    public TaxTransactionDto toggleDeductible(@PathVariable Long id){ return service.toggleDeductible(id); }

    @PostMapping("/{id}/mark-receipt")
    @Operation(summary = "Mark receipt uploaded")
    public TaxTransactionDto markReceipt(@PathVariable Long id){ return service.markReceipt(id); }

    @PostMapping(value="/{id}/upload-receipt", consumes = {"multipart/form-data"})
    @Operation(summary = "Upload receipt file")
    public TaxTransactionDto uploadReceipt(@PathVariable Long id, @RequestPart("file") MultipartFile file){ return service.uploadReceipt(id, file); }

    @GetMapping("/{id}/receipt")
    @Operation(summary = "Download receipt")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long id){ return service.downloadReceipt(id); }
}