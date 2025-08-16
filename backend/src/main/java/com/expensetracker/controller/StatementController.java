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
@io.swagger.v3.oas.annotations.tags.Tag(name = "Statements", description = "Upload and list bank statements")
public class StatementController {
    private final StatementService statementService;

    @Autowired
    public StatementController(StatementService statementService) {
        this.statementService = statementService;
    }

    @PostMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "Upload a bank statement PDF")
    public StatementUploadResponseDto uploadStatement(@RequestParam("file") MultipartFile file,
                                                      @RequestParam(value = "pdfPassword", required = false) String pdfPassword,
                                                      @RequestHeader("Authorization") String authHeader) {
            return statementService.uploadStatement(file, authHeader, pdfPassword);
     
    }

    @GetMapping
    @io.swagger.v3.oas.annotations.Operation(summary = "List uploaded statements")
    public List<RawStatementDto> getStatements(@RequestHeader("Authorization") String authHeader) {
        return statementService.getStatements(authHeader);
    }
}
