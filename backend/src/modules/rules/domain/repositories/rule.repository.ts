import { Rule, RuleStatus } from '../entities/rule.entity';

export interface RuleRepository {
  findById(id: string): Promise<Rule | null>;
  findAll(page: number, limit: number): Promise<{
    rules: Rule[];
    total: number;
    totalPages: number;
  }>;
  findActiveRules(): Promise<Rule[]>;
  findByType(type: string): Promise<Rule[]>;
  create(rule: Partial<Rule>): Promise<Rule>;
  update(id: string, updates: Partial<Rule>): Promise<Rule>;
  delete(id: string): Promise<void>;
  
  // Métodos específicos del dominio
  findByPriority(minPriority: number): Promise<Rule[]>;
  findByStatus(status: RuleStatus): Promise<Rule[]>;
  findByCreator(userId: string): Promise<Rule[]>;
  
  // Métodos para estadísticas
  countByStatus(status: RuleStatus): Promise<number>;
  getMostTriggeredRules(limit: number): Promise<Rule[]>;
  getLeastEffectiveRules(limit: number): Promise<Rule[]>;
}




