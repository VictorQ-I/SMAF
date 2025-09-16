import React from 'react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600">Configuración de perfil y preferencias</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de Perfil</h3>
          <p className="text-gray-500">Esta sección permitiría editar información personal y configuración.</p>
        </div>
      </div>
    </div>
  );
};




