package com.expensetracker.dto;

import java.util.List;

public record SpendingAlertListResponse(List<SpendingAlertDto> content,
                                        SpendingAlertSummaryDto summary,
                                        PageMeta page){
    public record PageMeta(int number, int size, long totalElements, int totalPages, boolean first, boolean last){}
}
