import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Rule } from './domain/entities/rule.entity';
import { RulesController } from './presentation/controllers/rules.controller';
import { RulesEngineService } from './application/services/rules-engine.service';
import { TypeOrmRuleRepository } from './infrastructure/persistence/repositories/typeorm-rule.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Rule])],
  controllers: [RulesController],
  providers: [
    RulesEngineService,
    {
      provide: 'RuleRepository',
      useClass: TypeOrmRuleRepository,
    },
  ],
  exports: ['RuleRepository', RulesEngineService],
})
export class RulesModule {}




