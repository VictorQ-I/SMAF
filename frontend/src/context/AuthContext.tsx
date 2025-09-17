import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginForm, AuthContextType } from '../types';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token almacenado al cargar la aplicación
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          authService.setAuthToken(token);
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginForm): Promise<void> => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      // Guardar token
      localStorage.setItem('authToken', response.token);
      authService.setAuthToken(response.token);
      
      // Establecer usuario
      setUser(response.user);
      
      toast.success(`¡Bienvenido, ${response.user.firstName}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    // Limpiar almacenamiento local
    localStorage.removeItem('authToken');
    
    // Limpiar contexto
    setUser(null);
    
    // Limpiar token del servicio
    authService.clearAuthToken();
    
    toast.success('Sesión cerrada exitosamente');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};




