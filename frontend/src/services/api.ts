import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../types';
import toast from 'react-hot-toast';

class ApiService {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor para agregar token de autenticación
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Agregar timestamp para evitar cache
        config.headers['X-Request-Time'] = new Date().toISOString();
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para manejo global de errores
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError): void {
    const response = error.response;
    
    if (!response) {
      toast.error('Error de conexión. Verifica tu conexión a internet.');
      return;
    }

    switch (response.status) {
      case 401:
        // Token expirado o inválido
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        break;
        
      case 403:
        toast.error('No tienes permisos para realizar esta acción.');
        break;
        
      case 404:
        toast.error('Recurso no encontrado.');
        break;
        
      case 429:
        toast.error('Demasiadas solicitudes. Intenta nuevamente en unos minutos.');
        break;
        
      case 500:
        toast.error('Error interno del servidor. Contacta al administrador.');
        break;
        
      default:
        const message = (response.data as any)?.message || 'Error inesperado';
        toast.error(message);
    }
  }

  // Métodos HTTP genéricos
  public async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, { params });
    return response.data;
  }

  public async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data);
    return response.data;
  }

  public async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url);
    return response.data;
  }

  // Método para upload de archivos
  public async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Método para download de archivos
  public async download(url: string, filename?: string): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Método para verificar conectividad
  public async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Configurar token de autenticación
  public setAuthToken(token: string): void {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Limpiar token de autenticación
  public clearAuthToken(): void {
    delete this.instance.defaults.headers.common['Authorization'];
  }

  // Obtener instancia de axios para casos especiales
  public getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService();

// Exportar también como default
export default apiService;




