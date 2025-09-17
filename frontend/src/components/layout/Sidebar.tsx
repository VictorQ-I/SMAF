import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  requiredRoles?: string[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Transacciones', href: '/transactions', icon: DocumentTextIcon },
  { name: 'Analítica', href: '/analytics', icon: ChartBarIcon },
  { 
    name: 'Reglas', 
    href: '/rules', 
    icon: Cog6ToothIcon,
    requiredRoles: ['admin', 'leader_analyst']
  },
  { 
    name: 'Reportes', 
    href: '/reports', 
    icon: DocumentArrowDownIcon,
    requiredRoles: ['admin', 'leader_analyst']
  },
  { 
    name: 'Auditoría', 
    href: '/audit', 
    icon: ShieldCheckIcon,
    requiredRoles: ['admin', 'leader_analyst']
  },
  { 
    name: 'Usuarios', 
    href: '/users', 
    icon: UsersIcon,
    requiredRoles: ['admin']
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const hasAccess = (item: NavigationItem): boolean => {
    if (!item.requiredRoles) return true;
    return user ? item.requiredRoles.includes(user.role) : false;
  };

  const isActive = (href: string): boolean => {
    return location.pathname === href;
  };

  return (
    <div className="flex h-full flex-col bg-white shadow-xl">
      {/* Header del sidebar */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between bg-primary-600 px-6">
        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
            <ShieldCheckIcon className="h-5 w-5 text-primary-600" />
          </div>
          <h1 className="ml-3 text-xl font-bold text-white">SMAF</h1>
        </div>
        
        {/* Botón de cerrar para móvil */}
        <button
          onClick={onClose}
          className="lg:hidden rounded-md text-white hover:bg-primary-700 p-1"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Información del usuario */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
            <span className="text-sm font-medium text-primary-600">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role === 'leader_analyst' ? 'Líder Analista' : 
               user?.role === 'analyst' ? 'Analista' :
               user?.role === 'admin' ? 'Administrador' : user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          if (!hasAccess(item)) return null;

          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`${
                active
                  ? 'bg-primary-50 border-r-2 border-primary-500 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-l-md transition-colors duration-200`}
            >
              <Icon
                className={`${
                  active ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                } mr-3 h-5 w-5 flex-shrink-0`}
              />
              {item.name}
              
              {/* Indicador de notificaciones (ejemplo para transacciones) */}
              {item.href === '/transactions' && (
                <span className="ml-auto inline-block h-2 w-2 rounded-full bg-red-400"></span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>SMAF v1.0.0</span>
          <div className="flex items-center">
            <div className="mr-1 h-2 w-2 rounded-full bg-green-400"></div>
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};




