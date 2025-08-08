export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  isPremium?: boolean;
  isSubscribed?: boolean;
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
  monthlyIncome: number;
  monthlyExpenses: number;
  transactionCount: number;
  topCategories: CategorySummary[];
  recentTransactions: Transaction[];
  lastUpdateTime: string;
  bankSources: string[];
  isMultiBank: boolean;
  hasBalanceDiscrepancy?: boolean;
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

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}