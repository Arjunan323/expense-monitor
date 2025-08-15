export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  isPremium?: boolean;
  isSubscribed?: boolean;
  locale?: string;
  currency?: string;
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
  advancedAnalyticsLocked?: boolean;
  upgradePrompt?: string;
  status?: string;
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
  status?: string;
  combinedBankLimit?: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  // Global usage / plan info
  usage?: UsageStats | null;
  usageLoading?: boolean;
  refreshUsage?: () => Promise<void>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
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