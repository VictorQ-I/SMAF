import { AuditLog, AuditAction, AuditEntityType } from '../entities/audit-log.entity';

export interface AuditRepository {
  findById(id: string): Promise<AuditLog | null>;
  findAll(
    page: number,
    limit: number,
    filters?: AuditFilters,
  ): Promise<{
    logs: AuditLog[];
    total: number;
    totalPages: number;
  }>;
  create(auditLog: Partial<AuditLog>): Promise<AuditLog>;
  
  // Métodos específicos del dominio
  findByUserId(userId: string, limit?: number): Promise<AuditLog[]>;
  findByEntityId(entityId: string): Promise<AuditLog[]>;
  findByAction(action: AuditAction): Promise<AuditLog[]>;
  findByEntityType(entityType: AuditEntityType): Promise<AuditLog[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]>;
  
  // Métodos para seguridad
  findSecurityEvents(userId?: string): Promise<AuditLog[]>;
  findFailedLogins(hours: number): Promise<AuditLog[]>;
  findHighRiskEvents(): Promise<AuditLog[]>;
  
  // Métodos para reportes
  getActivityStats(startDate: Date, endDate: Date): Promise<ActivityStats>;
  getUserActivitySummary(userId: string, days: number): Promise<UserActivitySummary>;
}

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  result?: string;
  startDate?: Date;
  endDate?: Date;
  riskLevel?: string;
  ipAddress?: string;
}

export interface ActivityStats {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  highRiskEvents: number;
  uniqueUsers: number;
  topActions: Array<{
    action: AuditAction;
    count: number;
  }>;
}

export interface UserActivitySummary {
  userId: string;
  totalActions: number;
  lastActivity: Date;
  topActions: Array<{
    action: AuditAction;
    count: number;
  }>;
  riskScore: number;
}




