import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RulesPage } from './pages/RulesPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditPage } from './pages/AuditPage';
import { UsersPage } from './pages/UsersPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Estilos
import './index.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <Routes>
            {/* Ruta pública - Login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rutas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Dashboard principal */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Transacciones */}
              <Route path="transactions" element={<TransactionsPage />} />
              
              {/* Analítica */}
              <Route path="analytics" element={<AnalyticsPage />} />
              
              {/* Reglas */}
              <Route path="rules" element={
                <ProtectedRoute requiredRoles={['admin', 'leader_analyst']}>
                  <RulesPage />
                </ProtectedRoute>
              } />
              
              {/* Reportes */}
              <Route path="reports" element={
                <ProtectedRoute requiredRoles={['admin', 'leader_analyst']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              
              {/* Auditoría */}
              <Route path="audit" element={
                <ProtectedRoute requiredRoles={['admin', 'leader_analyst']}>
                  <AuditPage />
                </ProtectedRoute>
              } />
              
              {/* Usuarios (solo admin) */}
              <Route path="users" element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              } />
              
              {/* Perfil de usuario */}
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            
            {/* Página 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        
        {/* Notificaciones toast */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </div>
  );
};

export default App;




