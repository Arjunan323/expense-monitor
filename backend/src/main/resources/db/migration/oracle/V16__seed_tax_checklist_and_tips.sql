-- Seed data for tax deduction checklist and tax saving tips
-- Flyway Migration: V16

-- Checklist items (initial baseline). Amount column kept textual for flexibility (e.g., limits, NA)
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('ELSS / Mutual Fund 80C investment planned', '80C', 0, 'Up to ₹1,50,000');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('Life insurance premium (self / spouse / child)', '80C', 0, '');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('EPF / VPF contribution tracked', '80C', 0, '');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('Public Provident Fund (PPF) deposit for FY made', '80C', 0, '');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('Tuition fees for children (claimed?)', '80C', 0, '');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('Health insurance premium (self + family)', '80D', 0, '₹25K / ₹50K senior');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('Parents health insurance premium', '80D', 0, '₹25K / ₹50K senior');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('Home loan interest certificate collected', '24(b)', 0, '₹2,00,000');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('Donations with 80G receipts (eligible?)', '80G', 0, '');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('Education loan interest certificate (80E)', '80E', 0, '');
INSERT INTO tax_deduction_checklist (item, category, checked, amount) VALUES ('Savings account interest (80TTA) aggregated', '80TTA', 0, '₹10,000');

-- Tax saving / optimization tips
INSERT INTO tax_saving_tips (title, message, icon) VALUES (
  'Max 80C Early',
  'Invest earlier in the year (ELSS / PPF / VPF) to benefit from rupee cost averaging and avoid last-minute liquidity crunch.',
  '💡'
);
INSERT INTO tax_saving_tips (title, message, icon) VALUES (
  'Health Insurance Timing',
  'Align health insurance renewal before FY end if you need to utilize remaining 80D headroom; keep payment mode traceable.',
  '🩺'
);
INSERT INTO tax_saving_tips (title, message, icon) VALUES (
  'Track Proofs Digitally',
  'Upload and tag receipts (insurance, tuition, rent, donations) immediately to avoid scramble during payroll proof submission.',
  '📁'
);
INSERT INTO tax_saving_tips (title, message, icon) VALUES (
  'Optimize Home Loan',
  'If close to exhausting Section 24(b) interest limit, consider partial prepayment on principal instead of excess interest outflow.',
  '🏠'
);
INSERT INTO tax_saving_tips (title, message, icon) VALUES (
  'Use 80G Smartly',
  'Prefer donations to approved institutions offering 100% deduction (with or without limit) for higher tax efficiency.',
  '🙏'
);
INSERT INTO tax_saving_tips (title, message, icon) VALUES (
  'TDS vs Advance Tax',
  'Project annual taxable income early and pay advance tax installments to avoid interest u/s 234B/234C.',
  '📊'
);
