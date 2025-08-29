package com.expensetracker.controller;

import com.expensetracker.dto.NotificationPreferenceDto;
import com.expensetracker.service.NotificationPreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications/preferences")
@Tag(name = "Notification Preferences", description = "Manage user email notification preferences")
public class NotificationPreferenceController {
    private final NotificationPreferenceService service;
    public NotificationPreferenceController(NotificationPreferenceService service){ this.service = service; }

    @GetMapping
    @Operation(summary = "List notification preferences")
    public List<NotificationPreferenceDto> list(){ return service.list(); }

    @PostMapping
    @Operation(summary = "Create/update preference")
    public NotificationPreferenceDto upsert(@RequestParam String type, @RequestParam boolean emailEnabled){
        return service.upsert(type, emailEnabled);
    }
}
