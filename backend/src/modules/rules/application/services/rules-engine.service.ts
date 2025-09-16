import { Injectable, Inject } from '@nestjs/common';
import { Transaction } from '../../../transactions/domain/entities/transaction.entity';
import { Rule, RuleAction } from '../../domain/entities/rule.entity';
import { RuleRepository } from '../../domain/repositories/rule.repository';

export interface RuleEvaluationResult {
  triggeredRules: string[];
  totalRiskScore: number;
  blockedByRule: boolean;
  details: Array<{
    ruleId: string;
    ruleName: string;
    triggered: boolean;
    action: RuleAction;
    riskWeight: number;
    reason?: string;
  }>;
}

@Injectable()
export class RulesEngineService {
  constructor(
    @Inject('RuleRepository')
    private readonly ruleRepository: RuleRepository,
  ) {}

  async evaluateTransaction(transaction: Transaction): Promise<RuleEvaluationResult> {
    const activeRules = await this.ruleRepository.findActiveRules();
    
    const result: RuleEvaluationResult = {
      triggeredRules: [],
      totalRiskScore: 0,
      blockedByRule: false,
      details: [],
    };

    // Evaluar cada regla en orden de prioridad
    const sortedRules = activeRules.sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        rule.incrementExecution();
        const isTriggered = await this.evaluateRule(rule, transaction);
        
        const ruleDetail = {
          ruleId: rule.id,
          ruleName: rule.name,
          triggered: isTriggered,
          action: rule.action,
          riskWeight: rule.riskWeight,
          reason: isTriggered ? this.getRuleReason(rule, transaction) : undefined,
        };

        result.details.push(ruleDetail);

        if (isTriggered) {
          rule.incrementTriggered();
          result.triggeredRules.push(rule.name);
          result.totalRiskScore += rule.riskWeight;

          // Si la acción es REJECT, marcar como bloqueada
          if (rule.action === RuleAction.REJECT) {
            result.blockedByRule = true;
            break; // No evaluar más reglas si ya está bloqueada
          }
        }

        await this.ruleRepository.update(rule.id, {
          executionCount: rule.executionCount,
          triggeredCount: rule.triggeredCount,
          lastTriggered: rule.lastTriggered,
        });

      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
        // Continuar con la siguiente regla
      }
    }

    return result;
  }

  private async evaluateRule(rule: Rule, transaction: Transaction): Promise<boolean> {
    switch (rule.type) {
      case 'amount_limit':
        return rule.evaluateAmountLimit(transaction.amount);
      
      case 'time_restriction':
        return rule.evaluateTimeRestriction(transaction.createdAt);
      
      case 'country_blacklist':
        return rule.evaluateCountryBlacklist(transaction.countryCode);
      
      case 'bin_blacklist':
        return rule.evaluateBinBlacklist(transaction.bin);
      
      case 'velocity_check':
        return await this.evaluateVelocityRule(rule, transaction);
      
      case 'merchant_category':
        return this.evaluateMerchantCategory(rule, transaction);
      
      case 'ip_geolocation':
        return this.evaluateIpGeolocation(rule, transaction);
      
      case 'device_fingerprint':
        return this.evaluateDeviceFingerprint(rule, transaction);
      
      default:
        console.warn(`Unknown rule type: ${rule.type}`);
        return false;
    }
  }

  private async evaluateVelocityRule(rule: Rule, transaction: Transaction): Promise<boolean> {
    // Simular verificación de velocidad - en producción consultaría el repositorio
    const recentTransactionCount = 3; // Simulado
    const timeWindow = 60; // 60 minutos
    
    return rule.evaluateVelocityCheck(recentTransactionCount, timeWindow);
  }

  private evaluateMerchantCategory(rule: Rule, transaction: Transaction): boolean {
    const { blockedCategories, restrictedCategories } = rule.conditions;
    const mcc = transaction.merchantCategoryCode;

    if (blockedCategories && blockedCategories.includes(mcc)) {
      return true;
    }

    if (restrictedCategories && restrictedCategories.includes(mcc)) {
      // Aplicar restricciones adicionales
      const { maxAmount, allowedHours } = rule.parameters || {};
      
      if (maxAmount && transaction.amount > maxAmount) {
        return true;
      }

      if (allowedHours) {
        const hour = transaction.createdAt.getHours();
        if (!allowedHours.includes(hour)) {
          return true;
        }
      }
    }

    return false;
  }

  private evaluateIpGeolocation(rule: Rule, transaction: Transaction): boolean {
    if (!transaction.ipAddress) {
      return true; // Falta información crítica
    }

    const { blockedCountries, requireVpnCheck } = rule.conditions;

    // Simular geolocalización IP
    const ipCountry = this.getCountryFromIp(transaction.ipAddress);

    if (blockedCountries && blockedCountries.includes(ipCountry)) {
      return true;
    }

    if (requireVpnCheck && this.isVpnDetected(transaction.ipAddress)) {
      return true;
    }

    // Verificar inconsistencia geográfica
    if (ipCountry !== transaction.countryCode) {
      return true;
    }

    return false;
  }

  private evaluateDeviceFingerprint(rule: Rule, transaction: Transaction): boolean {
    if (!transaction.deviceFingerprint) {
      return true; // Falta información crítica
    }

    const { blockedDevices, requireKnownDevice } = rule.conditions;

    if (blockedDevices && blockedDevices.includes(transaction.deviceFingerprint)) {
      return true;
    }

    if (requireKnownDevice) {
      // Verificar si el dispositivo es conocido para esta tarjeta
      const isKnownDevice = this.isDeviceKnownForCard(
        transaction.cardNumber,
        transaction.deviceFingerprint,
      );
      
      if (!isKnownDevice) {
        return true;
      }
    }

    return false;
  }

  private getRuleReason(rule: Rule, transaction: Transaction): string {
    switch (rule.type) {
      case 'amount_limit':
        return `Monto ${transaction.getFormattedAmount()} fuera de límites permitidos`;
      case 'time_restriction':
        return `Transacción realizada en horario restringido`;
      case 'country_blacklist':
        return `País ${transaction.countryCode} está en lista negra`;
      case 'bin_blacklist':
        return `BIN ${transaction.bin} está en lista negra`;
      case 'velocity_check':
        return `Demasiadas transacciones en poco tiempo`;
      case 'merchant_category':
        return `Categoría de comercio ${transaction.merchantCategoryCode} restringida`;
      case 'ip_geolocation':
        return `Geolocalización IP sospechosa`;
      case 'device_fingerprint':
        return `Dispositivo no reconocido o bloqueado`;
      default:
        return 'Regla activada';
    }
  }

  // Métodos auxiliares simulados (en producción serían más complejos)
  private getCountryFromIp(ipAddress: string): string {
    // Simulación - en producción usar servicio de geolocalización
    return 'CO';
  }

  private isVpnDetected(ipAddress: string): boolean {
    // Simulación - en producción usar servicio de detección VPN
    return false;
  }

  private isDeviceKnownForCard(cardNumber: string, deviceFingerprint: string): boolean {
    // Simulación - en producción consultar base de datos de dispositivos conocidos
    return Math.random() > 0.3; // 70% de dispositivos "conocidos"
  }
}




