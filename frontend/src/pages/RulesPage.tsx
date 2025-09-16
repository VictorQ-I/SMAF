import React from 'react';

export const RulesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reglas</h1>
        <p className="text-gray-600">Configuración del motor de reglas antifraude</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Reglas</h3>
          <p className="text-gray-500">Esta sección permitiría crear y gestionar reglas de detección de fraude.</p>
        </div>
      </div>
    </div>
  );
};




