import React, { useEffect, useState } from 'react';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { transactionService } from '../services/transactionService';
import { DashboardStats, Transaction } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, pendingData] = await Promise.all([
          transactionService.getDashboardStats(),
          transactionService.getPendingReviewTransactions(),
        ]);
        
        setStats(statsData);
        setPendingTransactions(pendingData.slice(0, 5)); // Solo las primeras 5
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Datos para el gráfico de barras de transacciones por día
  const weeklyData = [
    { day: 'Dom', transactions: 12340, risk: 65 },
    { day: 'Lun', transactions: 18920, risk: 45 },
    { day: 'Mar', transactions: 22100, risk: 38 },
    { day: 'Mié', transactions: 19800, risk: 42 },
    { day: 'Jue', transactions: 21500, risk: 35 },
    { day: 'Vie', transactions: 23400, risk: 48 },
    { day: 'Sáb', transactions: 15600, risk: 72 },
  ];

  // Datos para el gráfico circular basado en el mockup
  const riskData = [
    { name: 'Aprobadas', value: stats?.riskDistribution?.low || 18409, color: '#22c55e' },
    { name: 'Rechazadas', value: 1409, color: '#ef4444' },
    { name: 'Transacciones hoy', value: stats?.today?.total || 65955, color: '#3b82f6' },
    { name: 'En revisión', value: stats?.today?.underReview || 652, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard - Estado de Transacciones</h1>
        <p className="text-gray-600">Resumen de actividad y métricas del sistema antifraude</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transacciones Hoy</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.today?.total?.toLocaleString() || '65,955'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Alto Riesgo</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.riskDistribution?.high || '847'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">En Revisión</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.today?.underReview || '652'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Score Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.thisWeek?.averageRiskScore?.toFixed(1) || '24.5'}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico circular - Estado de transacciones (basado en mockup) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Estado de transacciones</h3>
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-900">Hoy</span>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value.toLocaleString(), '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {riskData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de barras - Transacciones por día */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transacciones por día</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="transactions" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Casos recientes y Historial (basado en mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Casos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Casos</h3>
          
          {/* Tarjeta destacada */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-4 text-white mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90">MasterCard</div>
                <div className="text-lg font-semibold">Score 85</div>
              </div>
              <div className="bg-green-500 rounded-full px-3 py-1 text-xs font-medium">
                D
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm opacity-90">Datos tarjeta</div>
              <div className="font-mono">530691****5263</div>
            </div>
            <div className="mt-2 bg-red-500 bg-opacity-20 h-2 rounded-full">
              <div className="bg-red-300 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <div className="mt-1 bg-green-500 bg-opacity-20 h-2 rounded-full">
              <div className="bg-green-300 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-red-600">CR</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Correo</div>
                <div className="text-xs text-gray-500">mabetancourt@gmail.com</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-green-600">IP</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Ip</div>
                <div className="text-xs text-gray-500">35.86.116.138</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-green-600">MS</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Mensaje</div>
                <div className="text-xs text-gray-500">Tarjeta Vencida</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Transacciones hoy: 12,340</h4>
            <div className="flex justify-between items-end h-16">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, index) => (
                <div key={day} className="flex flex-col items-center">
                  <div 
                    className={`w-2 rounded-full ${index === 5 ? 'bg-red-400' : 'bg-green-400'}`}
                    style={{ height: `${20 + Math.random() * 40}px` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-1">{day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transacciones pendientes de revisión */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Transacciones Pendientes de Revisión
            </h3>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <EyeIcon className="h-4 w-4 mr-2" />
              Ver todas
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Transacción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarjeta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score de Riesgo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingTransactions.length > 0 ? (
                pendingTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transactionService.formatAmount(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transactionService.maskCardNumber(transaction.cardNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${transactionService.getRiskLevelColor(transaction.riskScore)}`}>
                          {transactionService.formatRiskScore(transaction.riskScore)}
                        </span>
                        <div className="ml-2 w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${
                              transaction.riskScore >= 70 ? 'bg-red-500' :
                              transaction.riskScore >= 30 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${transaction.riskScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transactionService.formatTime(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No hay transacciones pendientes de revisión
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};




