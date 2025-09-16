import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '../../domain/entities/transaction.entity';

export class UpdateTransactionDto {
  @ApiProperty({
    description: 'Nuevo estado de la transacción',
    enum: TransactionStatus,
    example: TransactionStatus.APPROVED,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({
    description: 'ID del usuario que revisa la transacción',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  reviewedBy?: string;

  @ApiProperty({
    description: 'Notas de la revisión',
    example: 'Transacción aprobada después de verificación telefónica con el cliente',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  reviewNotes?: string;

  @ApiProperty({
    description: 'Código de autorización',
    example: 'AUTH123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  authorizationCode?: string;
}

export class ReviewTransactionDto {
  @ApiProperty({
    description: 'Decisión de revisión',
    enum: [TransactionStatus.APPROVED, TransactionStatus.REJECTED],
    example: TransactionStatus.APPROVED,
  })
  @IsEnum([TransactionStatus.APPROVED, TransactionStatus.REJECTED])
  decision: TransactionStatus.APPROVED | TransactionStatus.REJECTED;

  @ApiProperty({
    description: 'Notas de la revisión',
    example: 'Cliente verificado por teléfono, transacción legítima',
  })
  @IsString()
  @Length(10, 1000)
  reviewNotes: string;

  @ApiProperty({
    description: 'Código de autorización (solo para aprobaciones)',
    example: 'AUTH123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  authorizationCode?: string;
}

