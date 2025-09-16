import React from 'react';

export const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-600">Gestión de usuarios y permisos del sistema</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Administración de Usuarios</h3>
          <p className="text-gray-500">Esta sección permitiría gestionar usuarios y roles.</p>
        </div>
      </div>
    </div>
  );
};




