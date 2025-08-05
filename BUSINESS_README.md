# Expense Monitor

## Overview
Expense Monitor is a comprehensive platform designed to help individuals and businesses track, analyze, and manage their financial transactions. It leverages advanced AI and OCR technologies to extract transaction data from bank statements, categorize expenses, and provide actionable insights for better financial decision-making.

## Key Features
- **Automated Transaction Extraction:** Upload bank statements in PDF format and automatically extract transaction details using OCR and GPT-4-powered parsing.
- **Expense Categorization:** Transactions are categorized into common expense types (Food, Travel, Utilities, Salary, Shopping, Rent, Bank Fee, etc.) for easy analysis.
- **Dashboard & Analytics:** Visualize spending patterns, track balances, and monitor financial health through an interactive dashboard.
- **Secure Authentication:** User authentication and authorization are managed securely using JWT tokens.
- **Payment Integration:** Stripe integration for payment processing and premium feature access.

## How It Works
1. **Upload Statement:** Users upload their bank statement PDFs via the frontend.
2. **Extraction Pipeline:**
   - The backend uses `pdfplumber` and `pytesseract` to extract text from PDFs, including scanned images.
   - Text is chunked and sent to OpenAI's GPT-4 model for transaction parsing and categorization.
   - Extracted transactions are post-processed for accuracy and stored in the database.
3. **Dashboard:** Users view, filter, and analyze their transactions and spending trends.
4. **Payments:** Stripe integration enables secure payments for premium features.

## Technology Stack
- **Frontend:** React + TypeScript (Vite)
- **Backend:** Java (Spring Boot)
- **AI Extraction:** Python (OCR, OpenAI GPT-4)
- **Database:** (Not specified, but typically MySQL/PostgreSQL for Spring Boot)
- **Authentication:** JWT
- **Payments:** Stripe

## Folder Structure
- `frontend/` — React app for user interface
- `backend/` — Spring Boot REST API for business logic and data management
- `extraction_lambda/` — Python scripts for AI-powered transaction extraction

## Business Use Cases
- **Personal Finance:** Individuals can track and categorize their expenses, set budgets, and monitor savings.
- **Small Businesses:** Automate bookkeeping, expense tracking, and financial reporting.
- **Accountants:** Streamline client statement processing and transaction categorization.
- **Financial Advisors:** Provide clients with actionable insights based on spending patterns.

## Getting Started
1. **Clone the Repository:**
   ```sh
   git clone https://github.com/Arjunan323/expense-monitor.git
   ```
2. **Install Dependencies:**
   - Frontend: `npm install` in `frontend/`
   - Backend: Use Maven to build in `backend/`
   - Extraction Lambda: Ensure Python dependencies (`pdfplumber`, `pytesseract`, `openai`, etc.) are installed
3. **Configure API Keys:**
   - Set your OpenAI API key in `extraction_lambda.py`
   - Configure Stripe keys in backend
4. **Run Services:**
   - Start backend server
   - Start frontend app
   - Run extraction lambda as needed

## Security & Privacy
- All data is processed securely.
- Sensitive information (API keys, user data) is protected and not exposed.
- Stripe integration ensures PCI-compliant payment processing.

## Future Enhancements
- Multi-bank support
- Advanced analytics and forecasting
- Mobile app integration
- Team/organization expense management

## Contact & Support
For business inquiries, support, or partnership opportunities, please contact the repository owner via GitHub or open an issue in the repository.
