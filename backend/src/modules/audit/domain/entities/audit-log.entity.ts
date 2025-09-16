import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';

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

@Entity('audit_logs')
@Index(['userId'])
@Index(['entityType'])
@Index(['action'])
@Index(['result'])
@Index(['createdAt'])
@Index(['ipAddress'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditEntityType,
  })
  entityType: AuditEntityType;

  @Column({ type: 'uuid', nullable: true })
  entityId: string;

  @Column({
    type: 'enum',
    enum: AuditResult,
  })
  result: AuditResult;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  correlationId: string; // Para rastrear transacciones relacionadas

  @Column({ type: 'int', nullable: true })
  duration: number; // Duración en milisegundos

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  riskLevel: string; // low, medium, high, critical

  @CreateDateColumn()
  createdAt: Date;

  // Métodos de dominio
  isSuccessful(): boolean {
    return this.result === AuditResult.SUCCESS;
  }

  isSecurity related(): boolean {
    return [
      AuditAction.LOGIN,
      AuditAction.LOGOUT,
      AuditAction.PASSWORD_CHANGE,
      AuditAction.MFA_ENABLE,
      AuditAction.MFA_DISABLE,
    ].includes(this.action);
  }

  isTransactionRelated(): boolean {
    return [
      AuditAction.TRANSACTION_REVIEW,
      AuditAction.RULE_EXECUTION,
    ].includes(this.action) || this.entityType === AuditEntityType.TRANSACTION;
  }

  isHighRisk(): boolean {
    return this.riskLevel === 'high' || this.riskLevel === 'critical';
  }

  getFormattedDuration(): string {
    if (!this.duration) return 'N/A';
    
    if (this.duration < 1000) {
      return `${this.duration}ms`;
    }
    
    return `${(this.duration / 1000).toFixed(2)}s`;
  }

  // Métodos estáticos para crear logs específicos
  static createLoginLog(
    userId: string,
    ipAddress: string,
    userAgent: string,
    result: AuditResult,
    metadata?: Record<string, any>,
  ): Partial<AuditLog> {
    return {
      userId,
      action: AuditAction.LOGIN,
      entityType: AuditEntityType.AUTH,
      result,
      ipAddress,
      userAgent,
      metadata,
      riskLevel: result === AuditResult.FAILURE ? 'high' : 'low',
    };
  }

  static createTransactionReviewLog(
    userId: string,
    transactionId: string,
    result: AuditResult,
    oldStatus: string,
    newStatus: string,
    notes?: string,
  ): Partial<AuditLog> {
    return {
      userId,
      action: AuditAction.TRANSACTION_REVIEW,
      entityType: AuditEntityType.TRANSACTION,
      entityId: transactionId,
      result,
      description: notes,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      riskLevel: 'medium',
    };
  }

  static createRuleExecutionLog(
    ruleId: string,
    transactionId: string,
    result: AuditResult,
    riskScore: number,
    duration: number,
  ): Partial<AuditLog> {
    return {
      action: AuditAction.RULE_EXECUTION,
      entityType: AuditEntityType.RULE,
      entityId: ruleId,
      result,
      metadata: {
        transactionId,
        riskScore,
      },
      duration,
      riskLevel: riskScore > 70 ? 'high' : riskScore > 30 ? 'medium' : 'low',
    };
  }

  static createConfigChangeLog(
    userId: string,
    entityType: AuditEntityType,
    entityId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
  ): Partial<AuditLog> {
    return {
      userId,
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      result: AuditResult.SUCCESS,
      oldValues,
      newValues,
      riskLevel: 'medium',
    };
  }
}

