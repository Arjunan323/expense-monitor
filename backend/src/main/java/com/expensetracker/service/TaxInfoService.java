package com.expensetracker.service;

import com.expensetracker.model.TaxDeductionChecklistItem;
import com.expensetracker.model.TaxSavingTip;
import com.expensetracker.repository.TaxDeductionChecklistRepository;
import com.expensetracker.repository.TaxSavingTipRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TaxInfoService {
    private final TaxDeductionChecklistRepository checklistRepo;
    private final TaxSavingTipRepository tipRepo;
    public TaxInfoService(TaxDeductionChecklistRepository checklistRepo, TaxSavingTipRepository tipRepo) {
        this.checklistRepo = checklistRepo;
        this.tipRepo = tipRepo;
    }
    public List<TaxDeductionChecklistItem> getChecklist() { return checklistRepo.findAll(); }
    public List<TaxSavingTip> getTips() { return tipRepo.findAll(); }
}
