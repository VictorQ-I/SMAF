import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { TransactionRepository } from '../../domain/repositories/transaction.repository';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { TransactionDomainService } from '../../domain/services/transaction-domain.service';
import { RulesEngineService } from '../../../rules/application/services/rules-engine.service';
import { AuditService } from '../../../audit/application/services/audit.service';
import { CreateTransactionDto } from '../dtos/create-transaction.dto';

export interface ProcessTransactionResult {
  transaction: Transaction;
  riskScore: number;
  mlScore?: number;
  triggeredRules: string[];
  decision: TransactionStatus;
  processingTime: number;
}

@Injectable()
export class ProcessTransactionUseCase {
  constructor(
    @Inject('TransactionRepository')
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionDomainService: TransactionDomainService,
    private readonly rulesEngineService: RulesEngineService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  async execute(createTransactionDto: CreateTransactionDto): Promise<ProcessTransactionResult> {
    const startTime = Date.now();
    
    try {
      // 1. Crear la transacción inicial
      const transaction = await this.createInitialTransaction(createTransactionDto);

      // 2. Calcular score de riesgo base
      const baseRiskScore = this.transactionDomainService.calculateBaseRiskScore(transaction);

      // 3. Ejecutar motor de reglas
      const ruleResults = await this.rulesEngineService.evaluateTransaction(transaction);
      
      // 4. Obtener score de ML (opcional)
      const mlScore = await this.getMlScore(transaction);

      // 5. Combinar scores y determinar decisión
      const finalRiskScore = this.transactionDomainService.combineScores(
        baseRiskScore,
        ruleResults.totalRiskScore,
        mlScore,
      );

      const decision = this.determineDecision(finalRiskScore, ruleResults.blockedByRule);

      // 6. Actualizar transacción con resultados
      const updatedTransaction = await this.updateTransactionWithResults(
        transaction.id,
        finalRiskScore,
        mlScore,
        ruleResults,
        decision,
      );

      // 7. Registrar auditoría
      const processingTime = Date.now() - startTime;
      await this.auditService.logTransactionProcessing(
        updatedTransaction,
        processingTime,
        ruleResults.triggeredRules,
      );

      return {
        transaction: updatedTransaction,
        riskScore: finalRiskScore,
        mlScore,
        triggeredRules: ruleResults.triggeredRules,
        decision,
        processingTime,
      };

    } catch (error) {
      // Registrar error en auditoría
      await this.auditService.logTransactionError(
        createTransactionDto.transactionId,
        error.message,
        Date.now() - startTime,
      );
      throw error;
    }
  }

  private async createInitialTransaction(dto: CreateTransactionDto): Promise<Transaction> {
    // Generar un ID único si no se proporciona
    const transactionId = dto.transactionId || this.generateTransactionId();

    // Verificar que no exista una transacción con el mismo ID
    const existingTransaction = await this.transactionRepository.findByTransactionId(transactionId);
    if (existingTransaction) {
      throw new Error(`Transaction with ID ${transactionId} already exists`);
    }

    // Encriptar datos sensibles
    const encryptedCardNumber = await this.encryptCardNumber(dto.cardNumber);
    const encryptedCardholderName = await this.encryptCardholderName(dto.cardholderName);

    const transactionData: Partial<Transaction> = {
      transactionId,
      amount: dto.amount,
      currency: dto.currency || 'COP',
      type: dto.type,
      cardNumber: encryptedCardNumber,
      bin: dto.cardNumber.substring(0, 6),
      cardBrand: dto.cardBrand,
      cardholderName: encryptedCardholderName,
      merchantId: dto.merchantId,
      merchantName: dto.merchantName,
      merchantCategoryCode: dto.merchantCategoryCode,
      countryCode: dto.countryCode,
      city: dto.city,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      deviceFingerprint: dto.deviceFingerprint,
      status: TransactionStatus.PENDING,
    };

    return this.transactionRepository.create(transactionData);
  }

  private async getMlScore(transaction: Transaction): Promise<number | undefined> {
    try {
      const mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL');
      if (!mlServiceUrl) {
        console.warn('ML Service URL not configured');
        return undefined;
      }

      const response = await axios.post(
        `${mlServiceUrl}/predict`,
        {
          amount: transaction.amount,
          merchantCategoryCode: transaction.merchantCategoryCode,
          countryCode: transaction.countryCode,
          hour: transaction.createdAt.getHours(),
          dayOfWeek: transaction.createdAt.getDay(),
          bin: transaction.bin,
        },
        {
          timeout: 2000, // 2 segundos timeout
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.riskScore;
    } catch (error) {
      console.error('Error getting ML score:', error.message);
      return undefined;
    }
  }

  private determineDecision(
    riskScore: number,
    blockedByRule: boolean,
  ): TransactionStatus {
    if (blockedByRule) {
      return TransactionStatus.BLOCKED;
    }

    return this.transactionDomainService.getRecommendedAction({
      riskScore,
    } as Transaction);
  }

  private async updateTransactionWithResults(
    transactionId: string,
    riskScore: number,
    mlScore: number | undefined,
    ruleResults: any,
    decision: TransactionStatus,
  ): Promise<Transaction> {
    const updates: Partial<Transaction> = {
      riskScore,
      mlScore,
      ruleResults: {
        triggeredRules: ruleResults.triggeredRules,
        totalRiskScore: ruleResults.totalRiskScore,
        blockedByRule: ruleResults.blockedByRule,
        details: ruleResults.details,
      },
      status: decision,
      decisionReason: this.generateDecisionReason(riskScore, ruleResults.triggeredRules),
    };

    return this.transactionRepository.update(transactionId, updates);
  }

  private generateDecisionReason(
    riskScore: number,
    triggeredRules: string[],
  ): string {
    const reasons: string[] = [];

    if (riskScore >= 90) {
      reasons.push('Score de riesgo crítico');
    } else if (riskScore >= 70) {
      reasons.push('Score de riesgo alto');
    } else if (riskScore >= 30) {
      reasons.push('Score de riesgo medio');
    }

    if (triggeredRules.length > 0) {
      reasons.push(`Reglas activadas: ${triggeredRules.join(', ')}`);
    }

    return reasons.join('; ');
  }

  private generateTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `TXN_${timestamp}_${random}`.toUpperCase();
  }

  private async encryptCardNumber(cardNumber: string): Promise<string> {
    // Implementación simplificada - en producción usar crypto adecuado
    // Por ahora solo enmascararemos el número
    if (cardNumber.length < 16) {
      throw new Error('Invalid card number length');
    }
    
    const firstFour = cardNumber.substring(0, 4);
    const lastFour = cardNumber.substring(cardNumber.length - 4);
    return `${firstFour}${'*'.repeat(8)}${lastFour}`;
  }

  private async encryptCardholderName(cardholderName: string): Promise<string> {
    // Implementación simplificada - en producción usar crypto adecuado
    // Por ahora solo enmascararemos parcialmente
    const words = cardholderName.split(' ');
    return words.map((word, index) => {
      if (index === 0) return word; // Primer nombre completo
      return word.charAt(0) + '*'.repeat(word.length - 1);
    }).join(' ');
  }
}

