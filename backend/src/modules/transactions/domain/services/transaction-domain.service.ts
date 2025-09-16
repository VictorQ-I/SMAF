import { Injectable } from '@nestjs/common';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { Rule } from '../../../rules/domain/entities/rule.entity';

export interface FraudDetectionResult {
  isValid: boolean;
  riskScore: number;
  triggeredRules: string[];
  recommendedAction: TransactionStatus;
  reasons: string[];
  mlScore?: number;
}

export interface VelocityCheckResult {
  isViolation: boolean;
  transactionCount: number;
  timeWindow: number;
  threshold: number;
}

export interface GeoLocationResult {
  isAnomaly: boolean;
  countries: string[];
  timeSpan: number;
  riskLevel: 'low' | 'medium' | 'high';
}

@Injectable()
export class TransactionDomainService {
  /**
   * Calcula el score de riesgo base de una transacción
   */
  calculateBaseRiskScore(transaction: Transaction): number {
    let riskScore = 0;
    const reasons: string[] = [];

    // Factor 1: Monto de la transacción
    const amountRisk = this.calculateAmountRisk(transaction.amount);
    riskScore += amountRisk;
    if (amountRisk > 20) {
      reasons.push(`Monto alto: ${transaction.getFormattedAmount()}`);
    }

    // Factor 2: País de origen
    const countryRisk = this.calculateCountryRisk(transaction.countryCode);
    riskScore += countryRisk;
    if (countryRisk > 30) {
      reasons.push(`País de alto riesgo: ${transaction.countryCode}`);
    }

    // Factor 3: Horario de la transacción
    const timeRisk = this.calculateTimeRisk(transaction.createdAt);
    riskScore += timeRisk;
    if (timeRisk > 15) {
      reasons.push('Transacción en horario inusual');
    }

    // Factor 4: Categoría del comercio
    const merchantRisk = this.calculateMerchantRisk(transaction.merchantCategoryCode);
    riskScore += merchantRisk;
    if (merchantRisk > 10) {
      reasons.push(`Categoría de comercio de riesgo: ${transaction.merchantCategoryCode}`);
    }

    // Factor 5: BIN de la tarjeta
    const binRisk = this.calculateBinRisk(transaction.bin);
    riskScore += binRisk;
    if (binRisk > 20) {
      reasons.push(`BIN de alto riesgo: ${transaction.bin}`);
    }

    return Math.min(riskScore, 100); // Máximo 100
  }

  /**
   * Evalúa si una transacción necesita revisión manual
   */
  requiresManualReview(transaction: Transaction): boolean {
    // Criterios para revisión manual
    const highRiskFactors: boolean[] = [
      transaction.riskScore >= 70,
      transaction.amount >= 1000000, // 1M COP
      transaction.isFromRiskCountry(),
      this.isUnusualTime(transaction.createdAt),
      this.isHighRiskMerchant(transaction.merchantCategoryCode),
    ];

    // Si tiene 2 o más factores de alto riesgo, requiere revisión
    const riskFactorCount = highRiskFactors.filter(Boolean).length;
    return riskFactorCount >= 2;
  }

  /**
   * Determina la acción recomendada para una transacción
   */
  getRecommendedAction(transaction: Transaction): TransactionStatus {
    if (transaction.riskScore >= 90) {
      return TransactionStatus.BLOCKED;
    }

    if (transaction.riskScore >= 70 || this.requiresManualReview(transaction)) {
      return TransactionStatus.UNDER_REVIEW;
    }

    if (transaction.riskScore >= 30) {
      return TransactionStatus.APPROVED; // Aprobada con monitoreo
    }

    return TransactionStatus.APPROVED;
  }

  /**
   * Evalúa violaciones de velocidad
   */
  evaluateVelocity(
    recentTransactionCount: number,
    timeWindow: number,
    maxAllowed: number,
  ): VelocityCheckResult {
    return {
      isViolation: recentTransactionCount > maxAllowed,
      transactionCount: recentTransactionCount,
      timeWindow,
      threshold: maxAllowed,
    };
  }

  /**
   * Evalúa anomalías de geolocalización
   */
  evaluateGeoLocation(transactions: Transaction[]): GeoLocationResult {
    if (transactions.length === 0) {
      return {
        isAnomaly: false,
        countries: [],
        timeSpan: 0,
        riskLevel: 'low',
      };
    }

    const countries = [...new Set(transactions.map(t => t.countryCode))];
    const timeSpan = this.calculateTimeSpan(transactions);

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let isAnomaly = false;

    // Múltiples países en poco tiempo
    if (countries.length > 1) {
      if (timeSpan <= 30) { // 30 minutos
        riskLevel = 'high';
        isAnomaly = true;
      } else if (timeSpan <= 120) { // 2 horas
        riskLevel = 'medium';
        isAnomaly = true;
      }
    }

    return {
      isAnomaly,
      countries,
      timeSpan,
      riskLevel,
    };
  }

  /**
   * Combina scores de reglas y ML
   */
  combineScores(
    baseScore: number,
    ruleScore: number,
    mlScore?: number,
  ): number {
    let finalScore = baseScore;

    // Agregar peso de las reglas (40% del total)
    finalScore += ruleScore * 0.4;

    // Agregar peso del ML si está disponible (30% del total)
    if (mlScore !== undefined) {
      finalScore += mlScore * 0.3;
    }

    return Math.min(finalScore, 100);
  }

  /**
   * Verifica si la transacción cumple con límites PCI-DSS
   */
  validatePCICompliance(transaction: Transaction): {
    isCompliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Verificar que datos sensibles estén encriptados
    if (!this.isCardNumberEncrypted(transaction.cardNumber)) {
      violations.push('Número de tarjeta no está encriptado');
    }

    if (!this.isCardholderNameEncrypted(transaction.cardholderName)) {
      violations.push('Nombre del tarjetahabiente no está encriptado');
    }

    // Verificar geolocalización IP
    if (!transaction.ipAddress) {
      violations.push('Dirección IP no registrada');
    }

    return {
      isCompliant: violations.length === 0,
      violations,
    };
  }

  // Métodos privados para cálculos de riesgo
  private calculateAmountRisk(amount: number): number {
    if (amount >= 10000000) return 40; // 10M COP
    if (amount >= 5000000) return 30;  // 5M COP
    if (amount >= 1000000) return 20;  // 1M COP
    if (amount >= 500000) return 10;   // 500K COP
    return 0;
  }

  private calculateCountryRisk(countryCode: string): number {
    const highRiskCountries = ['VE', 'CU', 'IR', 'KP', 'SY'];
    const mediumRiskCountries = ['BR', 'AR', 'PE', 'EC'];

    if (highRiskCountries.includes(countryCode)) return 40;
    if (mediumRiskCountries.includes(countryCode)) return 20;
    return 0;
  }

  private calculateTimeRisk(transactionTime: Date): number {
    const hour = transactionTime.getHours();
    const day = transactionTime.getDay(); // 0 = Sunday

    // Horarios de alto riesgo: 11 PM - 6 AM
    if (hour >= 23 || hour <= 6) return 20;

    // Fines de semana
    if (day === 0 || day === 6) return 10;

    return 0;
  }

  private calculateMerchantRisk(mcc: string): number {
    const highRiskMCCs = ['7995', '7801', '6010', '6011']; // Casinos, ATM, etc.
    const mediumRiskMCCs = ['5411', '5541', '5542']; // Gasolineras, etc.

    if (highRiskMCCs.includes(mcc)) return 25;
    if (mediumRiskMCCs.includes(mcc)) return 15;
    return 0;
  }

  private calculateBinRisk(bin: string): number {
    // Lista de BINs de alto riesgo (esto debería venir de una base de datos)
    const highRiskBins = ['123456', '654321'];
    const mediumRiskBins = ['111111', '222222'];

    if (highRiskBins.includes(bin)) return 30;
    if (mediumRiskBins.includes(bin)) return 15;
    return 0;
  }

  private isUnusualTime(transactionTime: Date): boolean {
    const hour = transactionTime.getHours();
    return hour >= 23 || hour <= 6;
  }

  private isHighRiskMerchant(mcc: string): boolean {
    const highRiskMCCs = ['7995', '7801', '6010', '6011'];
    return highRiskMCCs.includes(mcc);
  }

  private calculateTimeSpan(transactions: Transaction[]): number {
    if (transactions.length <= 1) return 0;

    const times = transactions.map(t => t.createdAt.getTime()).sort();
    const earliest = Math.min(...times);
    const latest = Math.max(...times);

    return (latest - earliest) / (1000 * 60); // Diferencia en minutos
  }

  private isCardNumberEncrypted(cardNumber: string): boolean {
    // Verificar que no sea un número de tarjeta en texto plano
    return !/^\d{16}$/.test(cardNumber);
  }

  private isCardholderNameEncrypted(cardholderName: string): boolean {
    // Verificar que el nombre esté encriptado o tokenizado
    return cardholderName.length > 50 || !cardholderName.includes(' ');
  }
}

