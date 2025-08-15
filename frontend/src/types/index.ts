export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  isPremium?: boolean;
  isSubscribed?: boolean;
  locale?: string; // e.g. 'en-US', 'en-IN'
  currency?: string; // e.g. 'USD', 'INR'
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  balance: number;
  category: string;
  userId: number;
  createdAt: string;
  bankName?: string;
}

export interface RawStatement {
  id: number;
  fileName: string;
  uploadDate: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  userId: number;
  transactionCount?: number;
  bankName?: string;
  parseWarnings?: string[];
}

export interface DashboardStats {
  totalBalance: number;
  balanceByBank: { [bankName: string]: number };
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeByBank: { [bankName: string]: number };
  expensesByBank: { [bankName: string]: number };
  transactionCount: number;
  transactionCountByBank: { [bankName: string]: number };
  topCategories: CategorySummary[];
  topCategoriesByBank: { [bankName: string]: CategorySummary[] };
  recentTransactions: Transaction[];
  lastUpdateTime: string;
  bankSources: string[];
  multiBank: boolean;
  hasBalanceDiscrepancy?: boolean;
  // 3-tier plan feature lock fields
  advancedAnalyticsLocked?: boolean;
  upgradePrompt?: string;
  status?: string; // e.g. 'ACTIVE', 'EXPIRED', etc.
}

export interface CategorySummary {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface UsageStats {
  statementsThisMonth: number;
  statementLimit: number;
  planType: 'FREE' | 'PRO' | 'PREMIUM';
  pagesThisMonth: number;
  pageLimit: number;
  canUpload: boolean;
  status?: string; // e.g. 'ACTIVE', 'EXPIRED', etc.
  combinedBankLimit?: number;
}

export interface ParseResult {
  transactionCount: number;
  bankName?: string;
  warnings?: string[];
  success: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface AnalyticsFeedbackPayload {
  email?: string; // optional if user logged in
  features: string[]; // selected feature identifiers
  message?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Bank & Category master records (aggregated counts)
export interface BankRecord {
  id: number;
  name: string;
  transactionCount: number;
}

export interface CategoryRecord {
  id: number;
  name: string;
  transactionCount: number;
}

export interface TransactionFilters {
  banks: string[];
  dateRange: {
    start: string;
    end: string;
  };
  categories: string[];
  amountRange: {
    min: number | null;
    max: number | null;
  };
  transactionType: 'all' | 'credit' | 'debit';
  description: string;
  sortBy: 'date' | 'amount' | 'category' | 'bank';
  sortOrder: 'asc' | 'desc';
}

// Analytics
export interface AnalyticsCategorySpend {
  category: string;
  amount: number; // negative = spend, positive = income
  transactions: number;
}

export interface AnalyticsSummary {
  topCategories: AnalyticsCategorySpend[];
  totalInflow: number;
  totalOutflow: number; // negative
  netCashFlow: number;
  monthlyTrend: { [month: string]: number }; // yyyy-MM -> net
  averageDailySpend: number;
}