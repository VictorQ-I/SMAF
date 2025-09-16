import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLog } from './domain/entities/audit-log.entity';
import { AuditController } from './presentation/controllers/audit.controller';
import { AuditService } from './application/services/audit.service';
import { TypeOrmAuditRepository } from './infrastructure/persistence/repositories/typeorm-audit.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [
    AuditService,
    {
      provide: 'AuditRepository',
      useClass: TypeOrmAuditRepository,
    },
  ],
  exports: ['AuditRepository', AuditService],
})
export class AuditModule {}




