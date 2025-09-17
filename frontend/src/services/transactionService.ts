import { apiService } from './api';
import { 
  Transaction, 
  TransactionFilters, 
  PaginatedResponse, 
  DashboardStats,
  TransactionStatus 
} from '../types';

export class TransactionService {
  // Obtener lista de transacciones con filtros y paginación
  async getTransactions(filters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction>> {
    const response = await apiService.get<PaginatedResponse<Transaction>>('/transactions', filters);
    
    if (!response.success) {
      throw new Error(response.message || 'Error obteniendo transacciones');
    }

    return response.data!;
  }

  // Obtener transacción por ID
  async getTransactionById(id: string): Promise<Transaction> {
    const response = await apiService.get<Transaction>(`/transactions/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error obteniendo transacción');
    }

    return response.data!;
  }

  // Obtener transacciones pendientes de revisión
  async getPendingReviewTransactions(): Promise<Transaction[]> {
    const response = await apiService.get<{ transactions: Transaction[]; count: number }>('/transactions/pending/review');
    
    if (!response.success) {
      throw new Error(response.message || 'Error obteniendo transacciones pendientes');
    }

    return response.data!.transactions;
  }

  // Revisar transacción (aprobar/rechazar)
  async reviewTransaction(
    id: string, 
    decision: TransactionStatus.APPROVED | TransactionStatus.REJECTED,
    reviewNotes: string,
    authorizationCode?: string
  ): Promise<Transaction> {
    const response = await apiService.put<Transaction>(`/transactions/${id}/review`, {
      decision,
      reviewNotes,
      authorizationCode,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Error revisando transacción');
    }

    return response.data!;
  }

  // Actualizar transacción
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const response = await apiService.put<Transaction>(`/transactions/${id}`, updates);
    
    if (!response.success) {
      throw new Error(response.message || 'Error actualizando transacción');
    }

    return response.data!;
  }

  // Obtener estadísticas del dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiService.get<DashboardStats>('/transactions/stats/dashboard');
    
    if (!response.success) {
      throw new Error(response.message || 'Error obteniendo estadísticas');
    }

    return response.data!;
  }

  // Obtener análisis de riesgo
  async getRiskAnalysis(period: string = 'today'): Promise<any> {
    const response = await apiService.get('/transactions/risk-analysis', { period });
    
    if (!response.success) {
      throw new Error(response.message || 'Error obteniendo análisis de riesgo');
    }

    return response.data!;
  }

  // Procesar nueva transacción (para testing)
  async processTransaction(transactionData: any): Promise<any> {
    const response = await apiService.post('/transactions', transactionData);
    
    if (!response.success) {
      throw new Error(response.message || 'Error procesando transacción');
    }

    return response.data!;
  }

  // Exportar transacciones
  async exportTransactions(filters: TransactionFilters, format: 'csv' | 'excel' | 'pdf' = 'csv'): Promise<void> {
    const params = { ...filters, format };
    await apiService.download('/transactions/export', `transacciones_${new Date().toISOString().split('T')[0]}.${format}`);
  }

  // Obtener resumen de transacciones por período
  async getTransactionSummary(startDate: string, endDate: string): Promise<any> {
    const response = await apiService.get('/transactions/summary', { startDate, endDate });
    
    if (!response.success) {
      throw new Error(response.message || 'Error obteniendo resumen');
    }

    return response.data!;
  }

  // Obtener transacciones similares (para análisis de patrones)
  async getSimilarTransactions(transactionId: string): Promise<Transaction[]> {
    const response = await apiService.get<Transaction[]>(`/transactions/${transactionId}/similar`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error obteniendo transacciones similares');
    }

    return response.data!;
  }

  // Obtener métricas en tiempo real
  async getRealTimeMetrics(): Promise<any> {
    const response = await apiService.get('/transactions/metrics/realtime');
    
    if (!response.success) {
      throw new Error(response.message || 'Error obteniendo métricas en tiempo real');
    }

    return response.data!;
  }

  // Utilidades para formateo
  formatAmount(amount: number, currency: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  formatRiskScore(score: number): string {
    return `${score.toFixed(1)}%`;
  }

  getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score < 30) return 'low';
    if (score < 70) return 'medium';
    return 'high';
  }

  getRiskLevelColor(score: number): string {
    const level = this.getRiskLevel(score);
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getStatusColor(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case TransactionStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case TransactionStatus.UNDER_REVIEW:
        return 'bg-blue-100 text-blue-800';
      case TransactionStatus.BLOCKED:
        return 'bg-red-100 text-red-800';
      case TransactionStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.APPROVED:
        return 'Aprobada';
      case TransactionStatus.REJECTED:
        return 'Rechazada';
      case TransactionStatus.UNDER_REVIEW:
        return 'En Revisión';
      case TransactionStatus.BLOCKED:
        return 'Bloqueada';
      case TransactionStatus.PENDING:
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  }

  getCardBrandIcon(brand: string): string {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳'; // En producción usar iconos SVG apropiados
      case 'mastercard':
        return '💳';
      default:
        return '💳';
    }
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber || cardNumber.length < 16) {
      return 'XXXX-XXXX-XXXX-XXXX';
    }
    const firstFour = cardNumber.substring(0, 4);
    const lastFour = cardNumber.substring(cardNumber.length - 4);
    return `${firstFour}****${lastFour}`;
  }

  formatDateTime(dateString: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));
  }

  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(dateString));
  }

  formatTime(dateString: string): string {
    return new Intl.DateTimeFormat('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));
  }
}

// Instancia singleton del servicio de transacciones
export const transactionService = new TransactionService();




