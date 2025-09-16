import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ANALYST,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'boolean', default: false })
  mfaEnabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mfaSecret: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'inet', nullable: true })
  lastLoginIp: string;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Métodos de dominio
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  canAccessReports(): boolean {
    return [UserRole.ADMIN, UserRole.LEADER_ANALYST].includes(this.role);
  }

  canModifyRules(): boolean {
    return [UserRole.ADMIN, UserRole.LEADER_ANALYST].includes(this.role);
  }

  canReviewTransactions(): boolean {
    return [UserRole.ADMIN, UserRole.LEADER_ANALYST, UserRole.ANALYST].includes(this.role);
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

