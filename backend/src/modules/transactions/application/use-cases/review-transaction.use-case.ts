import { Injectable, Inject } from '@nestjs/common';
import { TransactionRepository } from '../../domain/repositories/transaction.repository';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { AuditService } from '../../../audit/application/services/audit.service';
import { ReviewTransactionDto } from '../dtos/update-transaction.dto';

export interface ReviewTransactionResult {
  transaction: Transaction;
  previousStatus: TransactionStatus;
  newStatus: TransactionStatus;
  reviewedAt: Date;
}

@Injectable()
export class ReviewTransactionUseCase {
  constructor(
    @Inject('TransactionRepository')
    private readonly transactionRepository: TransactionRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    transactionId: string,
    reviewDto: ReviewTransactionDto,
    reviewerId: string,
  ): Promise<ReviewTransactionResult> {
    // 1. Buscar la transacción
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 2. Verificar que la transacción puede ser revisada
    if (!transaction.canBeReviewed()) {
      throw new Error('Transaction cannot be reviewed');
    }

    const previousStatus = transaction.status;
    const reviewedAt = new Date();

    // 3. Actualizar la transacción
    const updatedTransaction = await this.transactionRepository.update(
      transactionId,
      {
        status: reviewDto.decision,
        reviewedBy: reviewerId,
        reviewedAt,
        reviewNotes: reviewDto.reviewNotes,
        authorizationCode: reviewDto.authorizationCode,
      },
    );

    // 4. Registrar en auditoría
    await this.auditService.logTransactionReview(
      reviewerId,
      transactionId,
      previousStatus,
      reviewDto.decision,
      reviewDto.reviewNotes,
    );

    return {
      transaction: updatedTransaction,
      previousStatus,
      newStatus: reviewDto.decision,
      reviewedAt,
    };
  }
}




