import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h2>
          <p className="text-gray-600">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Volver al Dashboard
          </Link>
          
          <div>
            <button
              onClick={() => window.history.back()}
              className="text-primary-600 hover:text-primary-500 text-sm font-medium"
            >
              ← Página anterior
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};




