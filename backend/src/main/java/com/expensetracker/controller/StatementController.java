package com.expensetracker.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import com.expensetracker.dto.StatementUploadResponseDto;
import com.expensetracker.dto.RawStatementDto;
import com.expensetracker.service.StatementService;
import java.util.List;

@RestController
@RequestMapping("/statements")
public class StatementController {
    private final StatementService statementService;

    @Autowired
    public StatementController(StatementService statementService) {
        this.statementService = statementService;
    }

    @PostMapping
    public StatementUploadResponseDto uploadStatement(@RequestParam("file") MultipartFile file, @RequestHeader("Authorization") String authHeader) {
        return statementService.uploadStatement(file, authHeader);
    }

    @GetMapping
    public List<RawStatementDto> getStatements(@RequestHeader("Authorization") String authHeader) {
        return statementService.getStatements(authHeader);
    }
}
