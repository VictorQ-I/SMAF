import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';

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

@Entity('rules')
@Index(['type'])
@Index(['status'])
@Index(['priority'])
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: RuleType,
  })
  type: RuleType;

  @Column({
    type: 'enum',
    enum: RuleAction,
  })
  action: RuleAction;

  @Column({
    type: 'enum',
    enum: RuleStatus,
    default: RuleStatus.ACTIVE,
  })
  status: RuleStatus;

  @Column({ type: 'int', default: 100 })
  priority: number; // Mayor número = mayor prioridad

  @Column({ type: 'json' })
  conditions: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  parameters: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  riskWeight: number; // Peso en el score de riesgo

  @Column({ type: 'varchar', length: 255, nullable: true })
  errorMessage: string;

  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @Column({ type: 'int', default: 0 })
  triggeredCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggered: Date;

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos de dominio
  isActive(): boolean {
    return this.status === RuleStatus.ACTIVE;
  }

  isTesting(): boolean {
    return this.status === RuleStatus.TESTING;
  }

  shouldExecute(): boolean {
    return this.isActive() || this.isTesting();
  }

  incrementExecution(): void {
    this.executionCount++;
  }

  incrementTriggered(): void {
    this.triggeredCount++;
    this.lastTriggered = new Date();
  }

  getEfficiencyRate(): number {
    if (this.executionCount === 0) return 0;
    return (this.triggeredCount / this.executionCount) * 100;
  }

  // Métodos para diferentes tipos de reglas
  evaluateAmountLimit(amount: number): boolean {
    if (this.type !== RuleType.AMOUNT_LIMIT) return false;
    
    const { minAmount, maxAmount } = this.conditions;
    
    if (minAmount && amount < minAmount) return true;
    if (maxAmount && amount > maxAmount) return true;
    
    return false;
  }

  evaluateTimeRestriction(transactionTime: Date): boolean {
    if (this.type !== RuleType.TIME_RESTRICTION) return false;
    
    const { allowedHours, restrictedDays } = this.conditions;
    const hour = transactionTime.getHours();
    const day = transactionTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (allowedHours && !allowedHours.includes(hour)) return true;
    if (restrictedDays && restrictedDays.includes(day)) return true;
    
    return false;
  }

  evaluateCountryBlacklist(countryCode: string): boolean {
    if (this.type !== RuleType.COUNTRY_BLACKLIST) return false;
    
    const { blacklistedCountries } = this.conditions;
    return blacklistedCountries && blacklistedCountries.includes(countryCode);
  }

  evaluateBinBlacklist(bin: string): boolean {
    if (this.type !== RuleType.BIN_BLACKLIST) return false;
    
    const { blacklistedBins } = this.conditions;
    return blacklistedBins && blacklistedBins.includes(bin);
  }

  evaluateVelocityCheck(recentTransactionCount: number, timeWindow: number): boolean {
    if (this.type !== RuleType.VELOCITY_CHECK) return false;
    
    const { maxTransactions, windowMinutes } = this.conditions;
    
    if (windowMinutes && timeWindow <= windowMinutes && 
        maxTransactions && recentTransactionCount > maxTransactions) {
      return true;
    }
    
    return false;
  }
}

