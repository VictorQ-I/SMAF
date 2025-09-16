import { Injectable, Inject } from '@nestjs/common';
import { TransactionRepository, TransactionFilters } from '../../domain/repositories/transaction.repository';
import { Transaction } from '../../domain/entities/transaction.entity';
import { User, UserRole } from '../../../users/domain/entities/user.entity';
import { QueryTransactionDto } from '../dtos/query-transaction.dto';
import { UpdateTransactionDto } from '../dtos/update-transaction.dto';

export interface GetTransactionsResult {
  transactions: Transaction[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

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

@Injectable()
export class GetTransactionsUseCase {
  constructor(
    @Inject('TransactionRepository')
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(
    queryDto: QueryTransactionDto,
    user: User,
  ): Promise<GetTransactionsResult> {
    // Aplicar filtros según el rol del usuario
    const filters = this.applyUserFilters(queryDto, user);

    const result = await this.transactionRepository.findAll(
      queryDto.page || 1,
      queryDto.limit || 20,
      filters,
    );

    return {
      ...result,
      currentPage: queryDto.page || 1,
      limit: queryDto.limit || 20,
    };
  }

  async getById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findById(id);
  }

  async getPendingReview(): Promise<Transaction[]> {
    return this.transactionRepository.findPendingReview();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 7);

    // Estadísticas del día
    const [
      todayTotal,
      todayApproved,
      todayRejected,
      todayPending,
      todayUnderReview,
    ] = await Promise.all([
      this.transactionRepository.countByDateRange(today, tomorrow),
      this.transactionRepository.countByDateRange(today, tomorrow),
      this.transactionRepository.countByDateRange(today, tomorrow),
      this.transactionRepository.countByDateRange(today, tomorrow),
      this.transactionRepository.countByDateRange(today, tomorrow),
    ]);

    // Estadísticas de la semana
    const [
      weekTotal,
      weekAvgRiskScore,
      weekHighRiskCount,
    ] = await Promise.all([
      this.transactionRepository.countByDateRange(thisWeekStart, tomorrow),
      this.transactionRepository.getAverageRiskScore(),
      this.transactionRepository.findByRiskScore(70, 100).then(t => t.length),
    ]);

    // Distribución de riesgo
    const [lowRisk, mediumRisk, highRisk] = await Promise.all([
      this.transactionRepository.findByRiskScore(0, 30).then(t => t.length),
      this.transactionRepository.findByRiskScore(30, 70).then(t => t.length),
      this.transactionRepository.findByRiskScore(70, 100).then(t => t.length),
    ]);

    // Top países (simplificado - en producción usar query más eficiente)
    const allTransactions = await this.transactionRepository.findByDateRange(thisWeekStart, tomorrow);
    const countryStats = this.calculateCountryStats(allTransactions);

    return {
      today: {
        total: todayTotal,
        approved: todayApproved,
        rejected: todayRejected,
        pending: todayPending,
        underReview: todayUnderReview,
      },
      thisWeek: {
        total: weekTotal,
        averageRiskScore: weekAvgRiskScore,
        highRiskCount: weekHighRiskCount,
      },
      riskDistribution: {
        low: lowRisk,
        medium: mediumRisk,
        high: highRisk,
      },
      topCountries: countryStats.slice(0, 5),
    };
  }

  async getRiskAnalysis(period: string): Promise<any> {
    const dateRange = this.getPeriodDates(period);
    const transactions = await this.transactionRepository.findByDateRange(
      dateRange.start,
      dateRange.end,
    );

    // Análisis de patrones sospechosos
    const suspiciousPatterns = await this.transactionRepository.findSuspiciousPatterns();
    
    // Análisis por hora del día
    const hourlyAnalysis = this.analyzeHourlyPatterns(transactions);
    
    // Análisis por país
    const countryAnalysis = this.analyzeCountryRisk(transactions);
    
    // Análisis de velocidad
    const velocityAnalysis = await this.analyzeVelocityPatterns(transactions);

    return {
      period,
      totalTransactions: transactions.length,
      suspiciousCount: suspiciousPatterns.length,
      patterns: {
        hourly: hourlyAnalysis,
        countries: countryAnalysis,
        velocity: velocityAnalysis,
      },
      recommendations: this.generateRecommendations(transactions),
    };
  }

  async update(
    id: string,
    updateDto: UpdateTransactionDto,
    userId: string,
  ): Promise<Transaction> {
    const updates = {
      ...updateDto,
      updatedBy: userId,
    };

    return this.transactionRepository.update(id, updates);
  }

  // Métodos privados
  private applyUserFilters(
    queryDto: QueryTransactionDto,
    user: User,
  ): TransactionFilters {
    const filters: TransactionFilters = {
      status: queryDto.status,
      cardBrand: queryDto.cardBrand,
      countryCode: queryDto.countryCode,
      merchantId: queryDto.merchantId,
      minAmount: queryDto.minAmount,
      maxAmount: queryDto.maxAmount,
      minRiskScore: queryDto.minRiskScore,
      maxRiskScore: queryDto.maxRiskScore,
      reviewedBy: queryDto.reviewedBy,
    };

    // Convertir fechas
    if (queryDto.startDate) {
      filters.startDate = new Date(queryDto.startDate);
    }
    if (queryDto.endDate) {
      filters.endDate = new Date(queryDto.endDate);
    }

    // Aplicar restricciones según rol
    if (user.role === UserRole.ANALYST) {
      // Los analistas solo pueden ver transacciones que requieren revisión o las que han revisado
      if (!queryDto.reviewedBy) {
        filters.reviewedBy = user.id;
      }
    }

    return filters;
  }

  private calculateCountryStats(transactions: Transaction[]) {
    const countryMap = new Map<string, { count: number; totalRisk: number }>();

    transactions.forEach(transaction => {
      const country = transaction.countryCode;
      if (countryMap.has(country)) {
        const stats = countryMap.get(country)!;
        stats.count++;
        stats.totalRisk += transaction.riskScore;
      } else {
        countryMap.set(country, {
          count: 1,
          totalRisk: transaction.riskScore,
        });
      }
    });

    return Array.from(countryMap.entries())
      .map(([country, stats]) => ({
        country,
        count: stats.count,
        avgRiskScore: stats.totalRisk / stats.count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private getPeriodDates(period: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      default:
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
  }

  private analyzeHourlyPatterns(transactions: Transaction[]) {
    const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      avgRiskScore: 0,
      totalRisk: 0,
    }));

    transactions.forEach(transaction => {
      const hour = transaction.createdAt.getHours();
      hourlyStats[hour].count++;
      hourlyStats[hour].totalRisk += transaction.riskScore;
    });

    return hourlyStats.map(stat => ({
      ...stat,
      avgRiskScore: stat.count > 0 ? stat.totalRisk / stat.count : 0,
    }));
  }

  private analyzeCountryRisk(transactions: Transaction[]) {
    return this.calculateCountryStats(transactions)
      .filter(stat => stat.avgRiskScore > 50)
      .slice(0, 10);
  }

  private async analyzeVelocityPatterns(transactions: Transaction[]) {
    const velocityViolations = [];
    const cardNumbers = [...new Set(transactions.map(t => t.cardNumber))];

    for (const cardNumber of cardNumbers.slice(0, 100)) { // Limitar para performance
      const violations = await this.transactionRepository.findVelocityViolations(
        cardNumber,
        60, // 60 minutos
      );
      
      if (violations > 5) { // Más de 5 transacciones en 60 minutos
        velocityViolations.push({
          cardNumber: cardNumber.substring(0, 6) + '****',
          violations,
        });
      }
    }

    return velocityViolations;
  }

  private generateRecommendations(transactions: Transaction[]): string[] {
    const recommendations: string[] = [];
    const highRiskCount = transactions.filter(t => t.riskScore > 70).length;
    const highRiskPercentage = (highRiskCount / transactions.length) * 100;

    if (highRiskPercentage > 20) {
      recommendations.push('Alto porcentaje de transacciones de riesgo - revisar reglas');
    }

    const nightTransactions = transactions.filter(t => {
      const hour = t.createdAt.getHours();
      return hour >= 22 || hour <= 6;
    }).length;

    if (nightTransactions > transactions.length * 0.3) {
      recommendations.push('Muchas transacciones nocturnas - considerar restricciones de horario');
    }

    return recommendations;
  }
}




