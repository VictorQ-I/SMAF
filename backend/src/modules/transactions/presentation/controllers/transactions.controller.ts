import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { UserRole } from '../../../users/domain/entities/user.entity';

import { ProcessTransactionUseCase } from '../../application/use-cases/process-transaction.use-case';
import { ReviewTransactionUseCase } from '../../application/use-cases/review-transaction.use-case';
import { GetTransactionsUseCase } from '../../application/use-cases/get-transactions.use-case';

import { CreateTransactionDto } from '../../application/dtos/create-transaction.dto';
import { UpdateTransactionDto, ReviewTransactionDto } from '../../application/dtos/update-transaction.dto';
import { QueryTransactionDto } from '../../application/dtos/query-transaction.dto';

@ApiTags('Transacciones')
@Controller('api/v1/transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(
    private readonly processTransactionUseCase: ProcessTransactionUseCase,
    private readonly reviewTransactionUseCase: ReviewTransactionUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Procesar nueva transacción',
    description: 'Recibe una transacción y la evalúa usando el motor de reglas y ML',
  })
  @ApiResponse({
    status: 201,
    description: 'Transacción procesada exitosamente',
    schema: {
      example: {
        transaction: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          transactionId: 'TXN_1234567890_ABC123',
          amount: 150000,
          status: 'approved',
          riskScore: 25.5,
        },
        riskScore: 25.5,
        mlScore: 15.2,
        triggeredRules: ['AMOUNT_CHECK'],
        decision: 'approved',
        processingTime: 85,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de transacción inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Transacción ya existe',
  })
  async processTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    try {
      const result = await this.processTransactionUseCase.execute(createTransactionDto);
      
      return {
        success: true,
        message: 'Transacción procesada exitosamente',
        data: result,
      };
    } catch (error) {
      if (error.message.includes('already exists')) {
        throw new HttpException(
          'Transacción ya existe',
          HttpStatus.CONFLICT,
        );
      }
      
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LEADER_ANALYST, UserRole.ANALYST)
  @ApiOperation({
    summary: 'Obtener lista de transacciones',
    description: 'Retorna transacciones con filtros y paginación',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de transacciones obtenida exitosamente',
  })
  async getTransactions(
    @Query() queryDto: QueryTransactionDto,
    @Request() req,
  ) {
    const result = await this.getTransactionsUseCase.execute(queryDto, req.user);
    
    return {
      success: true,
      message: 'Transacciones obtenidas exitosamente',
      data: result,
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LEADER_ANALYST, UserRole.ANALYST)
  @ApiOperation({
    summary: 'Obtener transacción por ID',
    description: 'Retorna los detalles de una transacción específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la transacción',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Transacción encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Transacción no encontrada',
  })
  async getTransactionById(@Param('id') id: string) {
    const transaction = await this.getTransactionsUseCase.getById(id);
    
    if (!transaction) {
      throw new HttpException(
        'Transacción no encontrada',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      message: 'Transacción encontrada',
      data: transaction,
    };
  }

  @Put(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LEADER_ANALYST, UserRole.ANALYST)
  @ApiOperation({
    summary: 'Revisar transacción',
    description: 'Permite a un analista aprobar o rechazar una transacción',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la transacción',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Transacción revisada exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Transacción no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Transacción no puede ser revisada',
  })
  async reviewTransaction(
    @Param('id') id: string,
    @Body() reviewDto: ReviewTransactionDto,
    @Request() req,
  ) {
    try {
      const result = await this.reviewTransactionUseCase.execute(
        id,
        reviewDto,
        req.user.id,
      );

      return {
        success: true,
        message: 'Transacción revisada exitosamente',
        data: result,
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          'Transacción no encontrada',
          HttpStatus.NOT_FOUND,
        );
      }

      if (error.message.includes('cannot be reviewed')) {
        throw new HttpException(
          'Transacción no puede ser revisada',
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('pending/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LEADER_ANALYST, UserRole.ANALYST)
  @ApiOperation({
    summary: 'Obtener transacciones pendientes de revisión',
    description: 'Retorna todas las transacciones que requieren revisión manual',
  })
  @ApiResponse({
    status: 200,
    description: 'Transacciones pendientes obtenidas exitosamente',
  })
  async getPendingReview() {
    const transactions = await this.getTransactionsUseCase.getPendingReview();

    return {
      success: true,
      message: 'Transacciones pendientes obtenidas exitosamente',
      data: {
        transactions,
        count: transactions.length,
      },
    };
  }

  @Get('stats/dashboard')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LEADER_ANALYST, UserRole.ANALYST)
  @ApiOperation({
    summary: 'Obtener estadísticas para dashboard',
    description: 'Retorna métricas y estadísticas de transacciones',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getDashboardStats() {
    const stats = await this.getTransactionsUseCase.getDashboardStats();

    return {
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: stats,
    };
  }

  @Get('risk-analysis')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LEADER_ANALYST)
  @ApiOperation({
    summary: 'Análisis de riesgo avanzado',
    description: 'Retorna análisis detallado de patrones de riesgo',
  })
  @ApiQuery({
    name: 'period',
    description: 'Período de análisis',
    enum: ['today', 'week', 'month'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis de riesgo obtenido exitosamente',
  })
  async getRiskAnalysis(
    @Query('period') period: string = 'today',
  ) {
    const analysis = await this.getTransactionsUseCase.getRiskAnalysis(period);

    return {
      success: true,
      message: 'Análisis de riesgo obtenido exitosamente',
      data: analysis,
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.LEADER_ANALYST)
  @ApiOperation({
    summary: 'Actualizar transacción',
    description: 'Permite actualizar campos específicos de una transacción',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la transacción',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Transacción actualizada exitosamente',
  })
  async updateTransaction(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransactionDto,
    @Request() req,
  ) {
    try {
      const result = await this.getTransactionsUseCase.update(
        id,
        updateDto,
        req.user.id,
      );

      return {
        success: true,
        message: 'Transacción actualizada exitosamente',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

