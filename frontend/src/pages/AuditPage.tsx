import React from 'react';

export const AuditPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-gray-600">Registro de auditoría y trazabilidad del sistema</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Logs de Auditoría</h3>
          <p className="text-gray-500">Esta sección mostraría todos los eventos del sistema.</p>
        </div>
      </div>
    </div>
  );
};




