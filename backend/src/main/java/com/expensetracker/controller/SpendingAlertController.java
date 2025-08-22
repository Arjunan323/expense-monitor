package com.expensetracker.controller;

import com.expensetracker.dto.*;
import com.expensetracker.service.SpendingAlertService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/analytics/spending-alerts")
public class SpendingAlertController {
    private final SpendingAlertService service;
    private final com.expensetracker.stream.SpendingAlertStreamPublisher publisher;
    public SpendingAlertController(SpendingAlertService s, com.expensetracker.stream.SpendingAlertStreamPublisher p){ this.service=s; this.publisher=p; }

    @GetMapping
    public SpendingAlertListResponse list(@RequestParam(required = false) String month,
                                       @RequestParam(defaultValue = "all") String type,
                                       @RequestParam(defaultValue = "all") String severity,
                                       @RequestParam(defaultValue = "false") String acknowledged,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "50") int size,
                                       @RequestParam(required = false) String sort){
        return service.listCombined(month, type, severity, acknowledged, page, size, sort);
    }

    @GetMapping("/{id}")
    public SpendingAlertDto get(@PathVariable Long id){ return service.get(id); }

    @GetMapping("/summary")
    public SpendingAlertSummaryDto summary(@RequestParam(required = false) String month){
        return service.summary(month);
    }

    @PostMapping("/{id}/acknowledge")
    public SpendingAlertDto acknowledge(@PathVariable Long id){ return service.acknowledge(id); }

    @DeleteMapping("/{id}")
    public void dismiss(@PathVariable Long id){ service.dismiss(id); }

    record IdsRequest(java.util.List<Long> ids){}

    @PostMapping("/acknowledge")
    public java.util.List<SpendingAlertDto> bulkAck(@RequestBody IdsRequest body){ return service.bulkAcknowledge(body.ids()); }

    @PostMapping("/dismiss")
    public void bulkDismiss(@RequestBody IdsRequest body){ service.bulkDismiss(body.ids()); }

    // Settings
    @GetMapping("/settings")
    public SpendingAlertSettingsDto getSettings(){ return service.getSettings(); }
    @PutMapping("/settings")
    public SpendingAlertSettingsDto updateSettings(@RequestBody SpendingAlertSettingsDto dto){ return service.updateSettings(dto); }

    // Whitelist
    record MerchantRequest(String merchant){}
    @GetMapping("/whitelist")
    public java.util.List<String> whitelist(){ return service.listWhitelist(); }
    @PostMapping("/whitelist")
    public void addWhitelist(@RequestBody MerchantRequest req){ service.addWhitelist(req.merchant()); }
    @DeleteMapping("/whitelist/{merchant}")
    public void deleteWhitelist(@PathVariable String merchant){ service.deleteWhitelist(merchant); }

    // Muted categories
    record MuteRequest(String category, String until){}
    @GetMapping("/mute-category")
    public java.util.List<com.expensetracker.model.SpendingAlertMutedCategory> muted(){ return service.listMuted(); }
    @PostMapping("/mute-category")
    public void mute(@RequestBody MuteRequest req){ service.muteCategory(req.category(), req.until()!=null? java.time.LocalDate.parse(req.until()): null); }
    @DeleteMapping("/mute-category/{category}")
    public void unmute(@PathVariable String category){ service.unmuteCategory(category); }

    // Recommendations
    @GetMapping("/recommendations")
    public java.util.Map<String,Object> recommendations(@RequestParam(required = false) String month){
        var list = service.recommendations(month);
        var tips = list.stream().filter(r-> "tip".equals(r.type())).toList();
        var suggested = list.stream().filter(r-> "suggested_limit".equals(r.type())).map(r-> java.util.Map.of(
                "category", r.category(),
                "currentMonthlyAvg", r.currentMonthlyAvg(),
                "suggestedCap", r.suggestedCap(),
                "rationale", r.rationale(),
                "id", r.id(),
                "title", r.title(),
                "message", r.message(),
                "icon", r.icon(),
                "priority", r.priority()
        )).toList();
        return java.util.Map.of("tips", tips, "suggestedLimits", suggested);
    }

    // Metadata
    @GetMapping("/meta")
    public java.util.Map<String,Object> meta(){ return service.meta(); }

    // Audit
    @GetMapping("/{id}/audit")
    public java.util.List<SpendingAlertAuditDto> audit(@PathVariable Long id){ return service.audit(id); }

    // Recompute trigger
    @PostMapping("/recompute")
    public SpendingAlertRecomputeResponse recompute(@RequestParam(required = false) String month){ return service.recompute(month); }

    // Backfill multiple months (count param, default 6 months including current)
    @PostMapping("/backfill")
    public java.util.List<SpendingAlertRecomputeResponse> backfill(@RequestParam(defaultValue = "6") int months){
        java.util.List<SpendingAlertRecomputeResponse> list = new java.util.ArrayList<>();
        java.time.YearMonth now = java.time.YearMonth.now();
        for(int i=0;i<months;i++){
            list.add(service.recompute(now.minusMonths(i).toString()));
        }
        return list;
    }

    // SSE stream
    @GetMapping("/stream")
    public SseEmitter stream(){ return publisher.register(); }

    // Merchant normalization (admin / maintenance) - params: batchSize, maxBatches
    @PostMapping("/normalize-merchants")
    public java.util.Map<String,Object> normalize(@RequestParam(defaultValue = "500") int batchSize,
                                                  @RequestParam(defaultValue = "20") int maxBatches){
        long updated = service.normalizeMerchants(batchSize, maxBatches);
        return java.util.Map.of("updated", updated);
    }
}
