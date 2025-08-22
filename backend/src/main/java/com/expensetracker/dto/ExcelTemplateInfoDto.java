package com.expensetracker.dto;

import java.util.List;

/** Metadata about an Excel import template provided to the frontend. */
public record ExcelTemplateInfoDto(String templateName,
                                   String downloadUrl,
                                   List<String> requiredColumns,
                                   List<String> optionalColumns,
                                   String version) { }