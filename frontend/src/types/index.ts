// Tipos principales del sistema SMAF

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  department?: string;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'admin',
  LEADER_ANALYST = 'leader_analyst',
  ANALYST = 'analyst',
  CLIENT = 'client',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  cardNumber: string; // Mascarado
  bin: string;
  cardBrand: CardBrand;
  cardholderName: string; // Mascarado
  merchantId: string;
  merchantName: string;
  merchantCategoryCode: string;
  countryCode: string;
  city: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  riskScore: number;
  mlScore?: number;
  ruleResults?: Record<string, any>;
  decisionReason?: string;
  authorizationCode?: string;
  reviewedBy?: string;
  reviewer?: User;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TransactionType {
  PURCHASE = 'purchase',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
  BLOCKED = 'blocked',
}

export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  type: RuleType;
  action: RuleAction;
  status: RuleStatus;
  priority: number;
  conditions: Record<string, any>;
  parameters?: Record<string, any>;
  riskWeight: number;
  errorMessage?: string;
  executionCount: number;
  triggeredCount: number;
  lastTriggered?: string;
  createdBy: string;
  creator?: User;
  updatedBy?: string;
  updater?: User;
  createdAt: string;
  updatedAt: string;
}

export enum RuleType {
  AMOUNT_LIMIT = 'amount_limit',
  TIME_RESTRICTION = 'time_restriction',
  COUNTRY_BLACKLIST = 'country_blacklist',
  BIN_BLACKLIST = 'bin_blacklist',
  VELOCITY_CHECK = 'velocity_check',
  MERCHANT_CATEGORY = 'merchant_category',
  IP_GEOLOCATION = 'ip_geolocation',
  DEVICE_FINGERPRINT = 'device_fingerprint',
}

export enum RuleAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  REVIEW = 'review',
  FLAG = 'flag',
}

export enum RuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TESTING = 'testing',
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  result: AuditResult;
  description?: string;
  metadata?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  duration?: number;
  errorMessage?: string;
  riskLevel?: string;
  createdAt: string;
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  TRANSACTION_REVIEW = 'transaction_review',
  RULE_EXECUTION = 'rule_execution',
  EXPORT_REPORT = 'export_report',
  CONFIG_CHANGE = 'config_change',
  PASSWORD_CHANGE = 'password_change',
  MFA_ENABLE = 'mfa_enable',
  MFA_DISABLE = 'mfa_disable',
}

export enum AuditEntityType {
  USER = 'user',
  TRANSACTION = 'transaction',
  RULE = 'rule',
  REPORT = 'report',
  AUTH = 'auth',
  SYSTEM = 'system',
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  WARNING = 'warning',
}

// Tipos para el dashboard y estadísticas
export interface DashboardStats {
  today: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    underReview: number;
  };
  thisWeek: {
    total: number;
    averageRiskScore: number;
    highRiskCount: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  topCountries: Array<{
    country: string;
    count: number;
    avgRiskScore: number;
  }>;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

// Tipos para formularios
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

export interface TransactionFilters {
  status?: TransactionStatus;
  cardBrand?: CardBrand;
  countryCode?: string;
  merchantId?: string;
  minAmount?: number;
  maxAmount?: number;
  minRiskScore?: number;
  maxRiskScore?: number;
  startDate?: string;
  endDate?: string;
  reviewedBy?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Tipos para contextos
export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginForm) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

// Tipos para notificaciones
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Tipos para modales
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Tipos para tablas
export interface Column<T = any> {
  key: keyof T | string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  onSort?: (key: string, direction: 'ASC' | 'DESC') => void;
  className?: string;
}

// Tipos para reportes
export interface ReportConfig {
  title: string;
  type: 'transactions' | 'audit' | 'rules' | 'users';
  format: 'pdf' | 'excel' | 'csv';
  filters: Record<string, any>;
  dateRange: {
    start: string;
    end: string;
  };
  fields: string[];
}

// Tipos para configuración de la aplicación
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'production' | 'staging';
  version: string;
  features: {
    mfa: boolean;
    reports: boolean;
    auditLogs: boolean;
    realTimeAlerts: boolean;
  };
}




