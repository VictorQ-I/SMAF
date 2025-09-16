import React from 'react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Generación y descarga de reportes del sistema</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Centro de Reportes</h3>
          <p className="text-gray-500">Esta sección permitiría generar reportes personalizados.</p>
        </div>
      </div>
    </div>
  );
};




