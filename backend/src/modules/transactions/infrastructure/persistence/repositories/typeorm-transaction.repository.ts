import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, In } from 'typeorm';
import {
  TransactionRepository,
  TransactionFilters,
  TransactionStats,
} from '../../../domain/repositories/transaction.repository';
import {
  Transaction,
  TransactionStatus,
} from '../../../domain/entities/transaction.entity';

@Injectable()
export class TypeOrmTransactionRepository implements TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { id },
      relations: ['reviewer'],
    });
  }

  async findByTransactionId(transactionId: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { transactionId },
      relations: ['reviewer'],
    });
  }

  async findAll(
    page: number,
    limit: number,
    filters: TransactionFilters = {},
  ): Promise<{
    transactions: Transaction[];
    total: number;
    totalPages: number;
  }> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.reviewer', 'reviewer');

    // Aplicar filtros
    if (filters.status) {
      queryBuilder.andWhere('transaction.status = :status', {
        status: filters.status,
      });
    }

    if (filters.cardBrand) {
      queryBuilder.andWhere('transaction.cardBrand = :cardBrand', {
        cardBrand: filters.cardBrand,
      });
    }

    if (filters.countryCode) {
      queryBuilder.andWhere('transaction.countryCode = :countryCode', {
        countryCode: filters.countryCode,
      });
    }

    if (filters.merchantId) {
      queryBuilder.andWhere('transaction.merchantId = :merchantId', {
        merchantId: filters.merchantId,
      });
    }

    if (filters.minAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount >= :minAmount', {
        minAmount: filters.minAmount,
      });
    }

    if (filters.maxAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount <= :maxAmount', {
        maxAmount: filters.maxAmount,
      });
    }

    if (filters.minRiskScore !== undefined) {
      queryBuilder.andWhere('transaction.riskScore >= :minRiskScore', {
        minRiskScore: filters.minRiskScore,
      });
    }

    if (filters.maxRiskScore !== undefined) {
      queryBuilder.andWhere('transaction.riskScore <= :maxRiskScore', {
        maxRiskScore: filters.maxRiskScore,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('transaction.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.reviewedBy) {
      queryBuilder.andWhere('transaction.reviewedBy = :reviewedBy', {
        reviewedBy: filters.reviewedBy,
      });
    }

    // Paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Ordenar por fecha de creación (más recientes primero)
    queryBuilder.orderBy('transaction.createdAt', 'DESC');

    const [transactions, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      transactions,
      total,
      totalPages,
    };
  }

  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.transactionRepository.create(transactionData);
    return this.transactionRepository.save(transaction);
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    await this.transactionRepository.update(id, updates);
    const updatedTransaction = await this.findById(id);
    if (!updatedTransaction) {
      throw new Error(`Transaction with id ${id} not found`);
    }
    return updatedTransaction;
  }

  async delete(id: string): Promise<void> {
    await this.transactionRepository.delete(id);
  }

  async findPendingReview(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: {
        status: In([TransactionStatus.PENDING, TransactionStatus.UNDER_REVIEW]),
      },
      relations: ['reviewer'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByCardNumber(
    cardNumber: string,
    limit: number = 50,
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { cardNumber },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByMerchant(
    merchantId: string,
    limit: number = 50,
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByRiskScore(
    minScore: number,
    maxScore: number,
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: {
        riskScore: Between(minScore, maxScore),
      },
      order: { riskScore: 'DESC' },
    });
  }

  async findRecentTransactionsByCard(
    cardNumber: string,
    minutes: number,
  ): Promise<Transaction[]> {
    const timeThreshold = new Date();
    timeThreshold.setMinutes(timeThreshold.getMinutes() - minutes);

    return this.transactionRepository.find({
      where: {
        cardNumber,
        createdAt: MoreThan(timeThreshold),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async countByStatus(status: TransactionStatus): Promise<number> {
    return this.transactionRepository.count({ where: { status } });
  }

  async countByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return this.transactionRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });
  }

  async getAverageRiskScore(): Promise<number> {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('AVG(transaction.riskScore)', 'avgRiskScore')
      .getRawOne();

    return parseFloat(result.avgRiskScore) || 0;
  }

  async getTransactionStats(): Promise<TransactionStats> {
    const [
      totalTransactions,
      approvedTransactions,
      rejectedTransactions,
      pendingTransactions,
      underReviewTransactions,
      averageRiskScore,
      amountStats,
    ] = await Promise.all([
      this.transactionRepository.count(),
      this.countByStatus(TransactionStatus.APPROVED),
      this.countByStatus(TransactionStatus.REJECTED),
      this.countByStatus(TransactionStatus.PENDING),
      this.countByStatus(TransactionStatus.UNDER_REVIEW),
      this.getAverageRiskScore(),
      this.transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'totalAmount')
        .addSelect('AVG(transaction.amount)', 'avgAmount')
        .getRawOne(),
    ]);

    const [highRiskCount, mediumRiskCount, lowRiskCount] = await Promise.all([
      this.transactionRepository.count({
        where: { riskScore: MoreThan(70) },
      }),
      this.transactionRepository.count({
        where: { riskScore: Between(30, 70) },
      }),
      this.transactionRepository.count({
        where: { riskScore: LessThan(30) },
      }),
    ]);

    return {
      totalTransactions,
      approvedTransactions,
      rejectedTransactions,
      pendingTransactions,
      underReviewTransactions,
      averageRiskScore,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      totalAmount: parseFloat(amountStats.totalAmount) || 0,
      averageAmount: parseFloat(amountStats.avgAmount) || 0,
    };
  }

  async findSuspiciousPatterns(): Promise<Transaction[]> {
    // Buscar transacciones con patrones sospechosos
    return this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.riskScore > :highRisk', { highRisk: 70 })
      .orWhere('transaction.amount > :highAmount', { highAmount: 5000000 }) // 5M COP
      .orWhere(
        'transaction.countryCode IN (:...riskCountries)',
        { riskCountries: ['VE', 'CU', 'IR', 'KP', 'SY'] },
      )
      .orderBy('transaction.riskScore', 'DESC')
      .limit(100)
      .getMany();
  }

  async findVelocityViolations(
    cardNumber: string,
    timeWindow: number,
  ): Promise<number> {
    const timeThreshold = new Date();
    timeThreshold.setMinutes(timeThreshold.getMinutes() - timeWindow);

    return this.transactionRepository.count({
      where: {
        cardNumber,
        createdAt: MoreThan(timeThreshold),
      },
    });
  }

  async findGeoLocationAnomalies(cardNumber: string): Promise<Transaction[]> {
    // Buscar transacciones de la misma tarjeta en diferentes países en un período corto
    const recentTransactions = await this.findRecentTransactionsByCard(
      cardNumber,
      60, // últimos 60 minutos
    );

    const countries = new Set(
      recentTransactions.map((t) => t.countryCode),
    );

    // Si hay transacciones en más de un país en 60 minutos, es sospechoso
    if (countries.size > 1) {
      return recentTransactions;
    }

    return [];
  }
}

