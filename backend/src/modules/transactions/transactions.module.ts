import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Transaction } from './domain/entities/transaction.entity';

// Controllers
import { TransactionsController } from './presentation/controllers/transactions.controller';

// Use Cases
import { ProcessTransactionUseCase } from './application/use-cases/process-transaction.use-case';
import { ReviewTransactionUseCase } from './application/use-cases/review-transaction.use-case';
import { GetTransactionsUseCase } from './application/use-cases/get-transactions.use-case';

// Domain Services
import { TransactionDomainService } from './domain/services/transaction-domain.service';

// Repositories
import { TypeOrmTransactionRepository } from './infrastructure/persistence/repositories/typeorm-transaction.repository';

// External Dependencies
import { RulesModule } from '../rules/rules.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    RulesModule,
    AuditModule,
  ],
  controllers: [TransactionsController],
  providers: [
    // Use Cases
    ProcessTransactionUseCase,
    ReviewTransactionUseCase,
    GetTransactionsUseCase,

    // Domain Services
    TransactionDomainService,

    // Repository Implementation
    {
      provide: 'TransactionRepository',
      useClass: TypeOrmTransactionRepository,
    },
  ],
  exports: [
    'TransactionRepository',
    TransactionDomainService,
    ProcessTransactionUseCase,
  ],
})
export class TransactionsModule {}

