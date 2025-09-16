import { Injectable, Inject } from '@nestjs/common';
import { AuditLog, AuditAction, AuditEntityType, AuditResult } from '../../domain/entities/audit-log.entity';
import { AuditRepository } from '../../domain/repositories/audit.repository';
import { Transaction, TransactionStatus } from '../../../transactions/domain/entities/transaction.entity';

@Injectable()
export class AuditService {
  constructor(
    @Inject('AuditRepository')
    private readonly auditRepository: AuditRepository,
  ) {}

  async logTransactionProcessing(
    transaction: Transaction,
    processingTime: number,
    triggeredRules: string[],
  ): Promise<void> {
    const auditLog: Partial<AuditLog> = {
      userId: null, // Sistema
      action: AuditAction.RULE_EXECUTION,
      entityType: AuditEntityType.TRANSACTION,
      entityId: transaction.id,
      result: AuditResult.SUCCESS,
      description: `Transacción procesada - Score: ${transaction.riskScore}`,
      metadata: {
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        riskScore: transaction.riskScore,
        mlScore: transaction.mlScore,
        triggeredRules,
        decision: transaction.status,
      },
      duration: processingTime,
      riskLevel: transaction.riskScore > 70 ? 'high' : transaction.riskScore > 30 ? 'medium' : 'low',
    };

    await this.auditRepository.create(auditLog);
  }

  async logTransactionReview(
    reviewerId: string,
    transactionId: string,
    oldStatus: TransactionStatus,
    newStatus: TransactionStatus,
    notes?: string,
  ): Promise<void> {
    const auditLog: Partial<AuditLog> = {
      userId: reviewerId,
      action: AuditAction.TRANSACTION_REVIEW,
      entityType: AuditEntityType.TRANSACTION,
      entityId: transactionId,
      result: AuditResult.SUCCESS,
      description: notes || `Transacción revisada: ${oldStatus} → ${newStatus}`,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      riskLevel: 'medium',
    };

    await this.auditRepository.create(auditLog);
  }

  async logTransactionError(
    transactionId: string,
    errorMessage: string,
    processingTime: number,
  ): Promise<void> {
    const auditLog: Partial<AuditLog> = {
      userId: null,
      action: AuditAction.RULE_EXECUTION,
      entityType: AuditEntityType.TRANSACTION,
      entityId: transactionId,
      result: AuditResult.FAILURE,
      description: 'Error procesando transacción',
      errorMessage,
      duration: processingTime,
      riskLevel: 'high',
    };

    await this.auditRepository.create(auditLog);
  }

  async logUserLogin(
    userId: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const auditLog = AuditLog.createLoginLog(
      userId,
      ipAddress,
      userAgent,
      success ? AuditResult.SUCCESS : AuditResult.FAILURE,
      metadata,
    );

    await this.auditRepository.create(auditLog);
  }

  async logConfigChange(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
  ): Promise<void> {
    const auditLog = AuditLog.createConfigChangeLog(
      userId,
      entityType,
      entityId,
      oldValues,
      newValues,
    );

    await this.auditRepository.create(auditLog);
  }

  async logReportExport(
    userId: string,
    reportType: string,
    filters: Record<string, any>,
  ): Promise<void> {
    const auditLog: Partial<AuditLog> = {
      userId,
      action: AuditAction.EXPORT_REPORT,
      entityType: AuditEntityType.REPORT,
      result: AuditResult.SUCCESS,
      description: `Reporte exportado: ${reportType}`,
      metadata: {
        reportType,
        filters,
      },
      riskLevel: 'low',
    };

    await this.auditRepository.create(auditLog);
  }

  async getAuditLogs(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<{
    logs: AuditLog[];
    total: number;
    totalPages: number;
  }> {
    return this.auditRepository.findAll(page, limit, filters);
  }

  async getSecurityEvents(userId?: string): Promise<AuditLog[]> {
    return this.auditRepository.findSecurityEvents(userId);
  }

  async getTransactionAuditTrail(transactionId: string): Promise<AuditLog[]> {
    return this.auditRepository.findByEntityId(transactionId);
  }
}




