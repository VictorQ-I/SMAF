import { IsEnum, IsNumber, IsString, IsOptional, IsPositive, Length, Matches, IsIP } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, CardBrand } from '../../domain/entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'ID único de la transacción',
    example: 'TXN_1234567890_ABC123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  transactionId?: string;

  @ApiProperty({
    description: 'Monto de la transacción',
    example: 150000,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Moneda de la transacción',
    example: 'COP',
    default: 'COP',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiProperty({
    description: 'Tipo de transacción',
    enum: TransactionType,
    example: TransactionType.PURCHASE,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Número de tarjeta (será encriptado)',
    example: '4111111111111111',
  })
  @IsString()
  @Matches(/^\d{13,19}$/, {
    message: 'Número de tarjeta debe tener entre 13 y 19 dígitos',
  })
  cardNumber: string;

  @ApiProperty({
    description: 'Marca de la tarjeta',
    enum: CardBrand,
    example: CardBrand.VISA,
  })
  @IsEnum(CardBrand)
  cardBrand: CardBrand;

  @ApiProperty({
    description: 'Nombre del tarjetahabiente',
    example: 'JUAN CARLOS RODRIGUEZ',
  })
  @IsString()
  @Length(2, 100)
  cardholderName: string;

  @ApiProperty({
    description: 'ID del comercio',
    example: 'MERCHANT_12345',
  })
  @IsString()
  @Length(1, 255)
  merchantId: string;

  @ApiProperty({
    description: 'Nombre del comercio',
    example: 'Tienda Online XYZ',
  })
  @IsString()
  @Length(1, 255)
  merchantName: string;

  @ApiProperty({
    description: 'Código de categoría del comercio (MCC)',
    example: '5411',
  })
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/, {
    message: 'MCC debe tener exactamente 4 dígitos',
  })
  merchantCategoryCode: string;

  @ApiProperty({
    description: 'Código de país (ISO 3166-1 alpha-2)',
    example: 'CO',
  })
  @IsString()
  @Length(2, 3)
  countryCode: string;

  @ApiProperty({
    description: 'Ciudad de la transacción',
    example: 'Medellín',
  })
  @IsString()
  @Length(1, 100)
  city: string;

  @ApiProperty({
    description: 'Dirección IP del cliente',
    example: '192.168.1.100',
    required: false,
  })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiProperty({
    description: 'User Agent del navegador',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  userAgent?: string;

  @ApiProperty({
    description: 'Huella digital del dispositivo',
    example: 'fp_1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  deviceFingerprint?: string;
}

