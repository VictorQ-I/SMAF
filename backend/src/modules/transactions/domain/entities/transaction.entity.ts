import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
  BLOCKED = 'blocked',
}

export enum TransactionType {
  PURCHASE = 'purchase',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  REFUND = 'refund',
}

export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
}

@Entity('transactions')
@Index(['cardNumber'])
@Index(['merchantId'])
@Index(['status'])
@Index(['createdAt'])
@Index(['riskScore'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  transactionId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'COP' })
  currency: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 19 })
  cardNumber: string; // Encriptado

  @Column({ type: 'varchar', length: 6 })
  bin: string; // Bank Identification Number

  @Column({
    type: 'enum',
    enum: CardBrand,
  })
  cardBrand: CardBrand;

  @Column({ type: 'varchar', length: 100 })
  cardholderName: string; // Encriptado

  @Column({ type: 'varchar', length: 255 })
  merchantId: string;

  @Column({ type: 'varchar', length: 255 })
  merchantName: string;

  @Column({ type: 'varchar', length: 10 })
  merchantCategoryCode: string;

  @Column({ type: 'varchar', length: 3 })
  countryCode: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  deviceFingerprint: string;

  @Column({ type: 'float', default: 0 })
  riskScore: number;

  @Column({ type: 'float', nullable: true })
  mlScore: number;

  @Column({ type: 'json', nullable: true })
  ruleResults: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  decisionReason: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  authorizationCode: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos de dominio
  isHighRisk(): boolean {
    return this.riskScore >= 70;
  }

  isMediumRisk(): boolean {
    return this.riskScore >= 30 && this.riskScore < 70;
  }

  isLowRisk(): boolean {
    return this.riskScore < 30;
  }

  needsReview(): boolean {
    return this.status === TransactionStatus.UNDER_REVIEW;
  }

  canBeReviewed(): boolean {
    return [TransactionStatus.PENDING, TransactionStatus.UNDER_REVIEW].includes(this.status);
  }

  isFromRiskCountry(): boolean {
    const riskCountries = ['VE', 'CU', 'IR', 'KP', 'SY'];
    return riskCountries.includes(this.countryCode);
  }

  isHighAmount(): boolean {
    return this.amount >= 1000000; // 1 millón COP
  }

  getFormattedAmount(): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  getMaskedCardNumber(): string {
    if (!this.cardNumber || this.cardNumber.length < 16) {
      return 'XXXX-XXXX-XXXX-XXXX';
    }
    const firstFour = this.cardNumber.substring(0, 4);
    const lastFour = this.cardNumber.substring(this.cardNumber.length - 4);
    return `${firstFour}****${lastFour}`;
  }
}

