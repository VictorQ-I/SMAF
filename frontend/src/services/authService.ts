import { apiService } from './api';
import { User, LoginForm } from '@/types';

interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

interface MfaResponse {
  user: User;
  token: string;
  backupCodes?: string[];
}

export class AuthService {
  // Iniciar sesión
  async login(credentials: LoginForm): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/login', credentials);
    
    if (!response.success) {
      throw new Error(response.message || 'Error en el login');
    }

    return response.data!;
  }

  // Verificar código MFA
  async verifyMfa(code: string): Promise<MfaResponse> {
    const response = await apiService.post<MfaResponse>('/auth/mfa/verify', { code });
    
    if (!response.success) {
      throw new Error(response.message || 'Código MFA inválido');
    }

    return response.data!;
  }

  // Obtener usuario actual
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<User>('/auth/me');
    
    if (!response.success) {
      throw new Error(response.message || 'Error obteniendo usuario');
    }

    return response.data!;
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      // Ignorar errores de logout en el servidor
      console.warn('Error en logout:', error);
    }
  }

  // Refrescar token
  async refreshToken(): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/refresh');
    
    if (!response.success) {
      throw new Error(response.message || 'Error refrescando token');
    }

    return response.data!;
  }

  // Solicitar restablecimiento de contraseña
  async requestPasswordReset(email: string): Promise<void> {
    const response = await apiService.post('/auth/forgot-password', { email });
    
    if (!response.success) {
      throw new Error(response.message || 'Error enviando correo de restablecimiento');
    }
  }

  // Restablecer contraseña
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiService.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Error restableciendo contraseña');
    }
  }

  // Cambiar contraseña
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiService.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Error cambiando contraseña');
    }
  }

  // Habilitar MFA
  async enableMfa(): Promise<{ qrCode: string; backupCodes: string[] }> {
    const response = await apiService.post('/auth/mfa/enable');
    
    if (!response.success) {
      throw new Error(response.message || 'Error habilitando MFA');
    }

    return response.data!;
  }

  // Deshabilitar MFA
  async disableMfa(code: string): Promise<void> {
    const response = await apiService.post('/auth/mfa/disable', { code });
    
    if (!response.success) {
      throw new Error(response.message || 'Error deshabilitando MFA');
    }
  }

  // Verificar si el token es válido
  async validateToken(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  // Configurar token en el servicio API
  setAuthToken(token: string): void {
    apiService.setAuthToken(token);
  }

  // Limpiar token del servicio API
  clearAuthToken(): void {
    apiService.clearAuthToken();
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(user: User | null, role: string): boolean {
    return user?.role === role;
  }

  // Verificar si el usuario tiene alguno de los roles especificados
  hasAnyRole(user: User | null, roles: string[]): boolean {
    return user ? roles.includes(user.role) : false;
  }

  // Verificar si el usuario puede acceder a reportes
  canAccessReports(user: User | null): boolean {
    return this.hasAnyRole(user, ['admin', 'leader_analyst']);
  }

  // Verificar si el usuario puede modificar reglas
  canModifyRules(user: User | null): boolean {
    return this.hasAnyRole(user, ['admin', 'leader_analyst']);
  }

  // Verificar si el usuario puede revisar transacciones
  canReviewTransactions(user: User | null): boolean {
    return this.hasAnyRole(user, ['admin', 'leader_analyst', 'analyst']);
  }

  // Obtener permisos del usuario
  getUserPermissions(user: User | null): string[] {
    if (!user) return [];

    const permissions: string[] = [];

    switch (user.role) {
      case 'admin':
        permissions.push(
          'view:dashboard',
          'view:transactions',
          'review:transactions',
          'create:rules',
          'edit:rules',
          'delete:rules',
          'view:audit',
          'export:reports',
          'manage:users'
        );
        break;

      case 'leader_analyst':
        permissions.push(
          'view:dashboard',
          'view:transactions',
          'review:transactions',
          'create:rules',
          'edit:rules',
          'view:audit',
          'export:reports'
        );
        break;

      case 'analyst':
        permissions.push(
          'view:dashboard',
          'view:transactions',
          'review:transactions',
          'view:audit'
        );
        break;

      default:
        break;
    }

    return permissions;
  }

  // Verificar si el usuario tiene un permiso específico
  hasPermission(user: User | null, permission: string): boolean {
    const permissions = this.getUserPermissions(user);
    return permissions.includes(permission);
  }
}

// Instancia singleton del servicio de autenticación
export const authService = new AuthService();




