import React, { useState, useEffect } from 'react';
import { Transaction, TransactionFilters, TransactionStatus } from '../types';
import { transactionService } from '../services/transactionService';
import { 
  FunnelIcon, 
  ArrowDownTrayIcon, 
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactions(filters);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewTransaction = async (
    id: string, 
    decision: TransactionStatus.APPROVED | TransactionStatus.REJECTED,
    notes: string
  ) => {
    try {
      await transactionService.reviewTransaction(id, decision, notes);
      await loadTransactions(); // Recargar la lista
    } catch (error) {
      console.error('Error reviewing transaction:', error);
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case TransactionStatus.APPROVED:
        return `${baseClasses} bg-green-100 text-green-800`;
      case TransactionStatus.REJECTED:
        return `${baseClasses} bg-red-100 text-red-800`;
      case TransactionStatus.UNDER_REVIEW:
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case TransactionStatus.BLOCKED:
        return `${baseClasses} bg-red-100 text-red-800`;
      case TransactionStatus.PENDING:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
          <p className="text-gray-600">Gestión y revisión de transacciones del sistema</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
          </button>
          
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select 
                className="form-input"
                value={filters.status || ''}
                onChange={(e) => setFilters({...filters, status: e.target.value as TransactionStatus || undefined})}
              >
                <option value="">Todos</option>
                <option value={TransactionStatus.PENDING}>Pendiente</option>
                <option value={TransactionStatus.APPROVED}>Aprobada</option>
                <option value={TransactionStatus.REJECTED}>Rechazada</option>
                <option value={TransactionStatus.UNDER_REVIEW}>En Revisión</option>
                <option value={TransactionStatus.BLOCKED}>Bloqueada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Mínimo</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={filters.minAmount || ''}
                onChange={(e) => setFilters({...filters, minAmount: e.target.value ? Number(e.target.value) : undefined})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Máximo</label>
              <input
                type="number"
                className="form-input"
                placeholder="Sin límite"
                value={filters.maxAmount || ''}
                onChange={(e) => setFilters({...filters, maxAmount: e.target.value ? Number(e.target.value) : undefined})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <input
                type="text"
                className="form-input"
                placeholder="CO, US, etc."
                value={filters.countryCode || ''}
                onChange={(e) => setFilters({...filters, countryCode: e.target.value || undefined})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Riesgo Mínimo</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                min="0"
                max="100"
                value={filters.minRiskScore || ''}
                onChange={(e) => setFilters({...filters, minRiskScore: e.target.value ? Number(e.target.value) : undefined})}
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center space-x-3">
            <button 
              onClick={() => loadTransactions()}
              className="btn btn-primary"
            >
              Aplicar Filtros
            </button>
            <button 
              onClick={() => {
                setFilters({ page: 1, limit: 20 });
                setShowFilters(false);
              }}
              className="btn btn-outline"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de transacciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarjeta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comercio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Riesgo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse h-6 bg-gray-200 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="animate-pulse h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.transactionId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transactionService.formatDateTime(transaction.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transactionService.formatAmount(transaction.amount, transaction.currency)}
                      </div>
                      <div className="text-sm text-gray-500">{transaction.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transactionService.maskCardNumber(transaction.cardNumber)}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {transaction.cardBrand}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.merchantName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.city}, {transaction.countryCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskScoreColor(transaction.riskScore)}`}>
                          {transactionService.formatRiskScore(transaction.riskScore)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(transaction.status)}>
                        {transactionService.getStatusText(transaction.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {transaction.status === TransactionStatus.UNDER_REVIEW && (
                        <>
                          <button
                            onClick={() => handleReviewTransaction(transaction.id, TransactionStatus.APPROVED, 'Aprobada por analista')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReviewTransaction(transaction.id, TransactionStatus.REJECTED, 'Rechazada por analista')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        No hay transacciones
                      </h3>
                      <p className="text-sm text-gray-500">
                        No se encontraron transacciones con los filtros actuales.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {transactions.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">1</span> a{' '}
                  <span className="font-medium">{transactions.length}</span> de{' '}
                  <span className="font-medium">{transactions.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Anterior
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-primary-600 text-sm font-medium text-white">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle de transacción */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setSelectedTransaction(null)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Detalle de Transacción
                  </h3>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID Transacción</label>
                      <p className="text-sm text-gray-900">{selectedTransaction.transactionId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estado</label>
                      <div className="mt-1">
                        <span className={getStatusBadge(selectedTransaction.status)}>
                          {transactionService.getStatusText(selectedTransaction.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Monto</label>
                      <p className="text-sm font-semibold text-gray-900">
                        {transactionService.formatAmount(selectedTransaction.amount, selectedTransaction.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Score de Riesgo</label>
                      <p className={`text-sm font-semibold ${transactionService.getRiskLevelColor(selectedTransaction.riskScore)}`}>
                        {transactionService.formatRiskScore(selectedTransaction.riskScore)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Razón de Decisión</label>
                    <p className="text-sm text-gray-900">{selectedTransaction.decisionReason || 'N/A'}</p>
                  </div>

                  {selectedTransaction.reviewNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notas de Revisión</label>
                      <p className="text-sm text-gray-900">{selectedTransaction.reviewNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};




