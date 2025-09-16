import { Module } from '@nestjs/common';

import { ReportsController } from './presentation/controllers/reports.controller';
import { ReportsService } from './application/services/reports.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TransactionsModule, AuditModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}




