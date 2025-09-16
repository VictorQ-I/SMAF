import { Module } from '@nestjs/common';

import { DecisionController } from './presentation/controllers/decision.controller';
import { DecisionEngineService } from './application/services/decision-engine.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { RulesModule } from '../rules/rules.module';

@Module({
  imports: [TransactionsModule, RulesModule],
  controllers: [DecisionController],
  providers: [DecisionEngineService],
  exports: [DecisionEngineService],
})
export class DecisionModule {}




