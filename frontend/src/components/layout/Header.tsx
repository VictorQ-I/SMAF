import React, { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [notifications] = useState([
    {
      id: 1,
      title: 'Transacción de alto riesgo',
      message: 'Se detectó una transacción con score 95/100',
      time: '5 min',
      unread: true,
    },
    {
      id: 2,
      title: 'Nueva regla activada',
      message: 'Regla de límite nocturno ha sido activada',
      time: '1 hora',
      unread: true,
    },
    {
      id: 3,
      title: 'Reporte mensual disponible',
      message: 'El reporte de transacciones de diciembre está listo',
      time: '3 horas',
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Botón del menú móvil */}
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Título de la página o breadcrumb */}
        <div className="flex-1 lg:ml-0">
          <h1 className="text-2xl font-semibold text-gray-900">
            Sistema Antifraude
          </h1>
        </div>

        {/* Acciones del header */}
        <div className="flex items-center space-x-4">
          {/* Indicador de estado del sistema */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span>Sistema operativo</span>
          </div>

          {/* Notificaciones */}
          <Menu as="div" className="relative">
            <Menu.Button className="relative rounded-full p-1 text-gray-400 hover:text-gray-500">
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <div
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0`}
                        >
                          <div className="flex items-start">
                            {notification.unread && (
                              <div className="mt-1 mr-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                hace {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </div>
                
                <div className="px-4 py-2 border-t border-gray-200">
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    Ver todas las notificaciones
                  </button>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Menú del usuario */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 rounded-full p-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role === 'leader_analyst' ? 'Líder Analista' : 
                   user?.role === 'analyst' ? 'Analista' :
                   user?.role === 'admin' ? 'Administrador' : user?.role}
                </p>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile"
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } flex items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <UserIcon className="mr-3 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/settings"
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } flex items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <CogIcon className="mr-3 h-4 w-4" />
                      Configuración
                    </Link>
                  )}
                </Menu.Item>
                
                <div className="border-t border-gray-100"></div>
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};




