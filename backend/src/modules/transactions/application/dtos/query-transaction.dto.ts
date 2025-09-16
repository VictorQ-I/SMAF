import { IsOptional, IsEnum, IsNumber, IsString, IsDateString, IsUUID, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus, CardBrand } from '../../domain/entities/transaction.entity';

export class QueryTransactionDto {
  @ApiProperty({
    description: 'Número de página',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Límite de resultados por página',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Filtrar por estado',
    enum: TransactionStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({
    description: 'Filtrar por marca de tarjeta',
    enum: CardBrand,
    required: false,
  })
  @IsOptional()
  @IsEnum(CardBrand)
  cardBrand?: CardBrand;

  @ApiProperty({
    description: 'Filtrar por código de país',
    example: 'CO',
    required: false,
  })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiProperty({
    description: 'Filtrar por ID de comercio',
    example: 'MERCHANT_12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiProperty({
    description: 'Monto mínimo',
    example: 100000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiProperty({
    description: 'Monto máximo',
    example: 5000000,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiProperty({
    description: 'Score de riesgo mínimo',
    example: 0,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minRiskScore?: number;

  @ApiProperty({
    description: 'Score de riesgo máximo',
    example: 100,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxRiskScore?: number;

  @ApiProperty({
    description: 'Fecha de inicio (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'ID del usuario que revisó',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  reviewedBy?: string;

  @ApiProperty({
    description: 'Ordenar por campo',
    example: 'createdAt',
    enum: ['createdAt', 'amount', 'riskScore', 'status'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Orden de clasificación',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({
    description: 'Búsqueda por texto libre',
    example: 'MERCHANT_12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

