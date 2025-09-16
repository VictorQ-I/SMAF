import { Transaction, TransactionStatus } from '../entities/transaction.entity';

export interface TransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByTransactionId(transactionId: string): Promise<Transaction | null>;
  findAll(
    page: number,
    limit: number,
    filters?: TransactionFilters,
  ): Promise<{
    transactions: Transaction[];
    total: number;
    totalPages: number;
  }>;
  create(transaction: Partial<Transaction>): Promise<Transaction>;
  update(id: string, updates: Partial<Transaction>): Promise<Transaction>;
  delete(id: string): Promise<void>;
  
  // Métodos específicos del dominio
  findPendingReview(): Promise<Transaction[]>;
  findByCardNumber(cardNumber: string, limit?: number): Promise<Transaction[]>;
  findByMerchant(merchantId: string, limit?: number): Promise<Transaction[]>;
  findByRiskScore(minScore: number, maxScore: number): Promise<Transaction[]>;
  findRecentTransactionsByCard(
    cardNumber: string,
    minutes: number,
  ): Promise<Transaction[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  
  // Métodos para estadísticas
  countByStatus(status: TransactionStatus): Promise<number>;
  countByDateRange(startDate: Date, endDate: Date): Promise<number>;
  getAverageRiskScore(): Promise<number>;
  getTransactionStats(): Promise<TransactionStats>;
  
  // Métodos para detección de patrones
  findSuspiciousPatterns(): Promise<Transaction[]>;
  findVelocityViolations(cardNumber: string, timeWindow: number): Promise<number>;
  findGeoLocationAnomalies(cardNumber: string): Promise<Transaction[]>;
}

export interface TransactionFilters {
  status?: TransactionStatus;
  cardBrand?: string;
  countryCode?: string;
  merchantId?: string;
  minAmount?: number;
  maxAmount?: number;
  minRiskScore?: number;
  maxRiskScore?: number;
  startDate?: Date;
  endDate?: Date;
  reviewedBy?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  approvedTransactions: number;
  rejectedTransactions: number;
  pendingTransactions: number;
  underReviewTransactions: number;
  averageRiskScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  totalAmount: number;
  averageAmount: number;
}

