# 🚀 Guía de Instalación SMAF

## ❌ **Problema Actual**
El sistema no tiene las dependencias necesarias instaladas para ejecutar SMAF.

## 📋 **Dependencias Requeridas**

### 1. **Docker Desktop** (Recomendado)
- **Descargar**: https://www.docker.com/products/docker-desktop/
- **Versión**: Docker Desktop 4.0+
- **Requisitos**: Windows 10/11 con WSL2

### 2. **Node.js** (Para desarrollo)
- **Descargar**: https://nodejs.org/
- **Versión**: Node.js 18 LTS o superior
- **Incluye**: npm (gestor de paquetes)

### 3. **Python** (Para ML Service)
- **Descargar**: https://www.python.org/downloads/
- **Versión**: Python 3.11 o superior
- **Incluye**: pip (gestor de paquetes)

### 4. **Git** (Para control de versiones)
- **Descargar**: https://git-scm.com/
- **Versión**: Git 2.30+

## 🔧 **Instalación Paso a Paso**

### **Paso 1: Instalar Docker Desktop**
1. Descargar Docker Desktop desde el enlace oficial
2. Ejecutar el instalador como administrador
3. Seguir el asistente de instalación
4. **Reiniciar el sistema** después de la instalación
5. Abrir Docker Desktop y esperar a que esté listo

### **Paso 2: Instalar Node.js**
1. Descargar Node.js LTS desde nodejs.org
2. Ejecutar el instalador
3. Asegurarse de marcar "Add to PATH"
4. Reiniciar la terminal

### **Paso 3: Instalar Python**
1. Descargar Python desde python.org
2. Ejecutar el instalador
3. **IMPORTANTE**: Marcar "Add Python to PATH"
4. Instalar pip si no está incluido

### **Paso 4: Instalar Git**
1. Descargar Git desde git-scm.com
2. Ejecutar el instalador
3. Usar configuración por defecto

## ✅ **Verificar Instalación**

Ejecutar estos comandos en PowerShell:

```bash
# Verificar Docker
docker --version
docker-compose --version

# Verificar Node.js
node --version
npm --version

# Verificar Python
python --version
pip --version

# Verificar Git
git --version
```

## 🚀 **Ejecutar SMAF**

Una vez instaladas todas las dependencias:

```bash
# 1. Verificar que Docker esté funcionando
docker run hello-world

# 2. Iniciar el sistema SMAF
docker-compose up -d

# 3. Verificar estado
docker-compose ps
```

## 🌐 **Acceder al Sistema**

- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000
- **ML Service**: http://localhost:5000

## 🆘 **Solución de Problemas**

### **Docker no inicia**
- Verificar que WSL2 esté habilitado
- Reiniciar Docker Desktop
- Verificar que la virtualización esté habilitada en BIOS

### **Node.js no se reconoce**
- Reiniciar la terminal
- Verificar que esté en el PATH
- Reinstalar Node.js

### **Python no se reconoce**
- Verificar que esté en el PATH
- Reinstalar Python marcando "Add to PATH"

## 📞 **Soporte**

Si tienes problemas con la instalación:
1. Verificar que todas las dependencias estén instaladas
2. Reiniciar el sistema
3. Ejecutar como administrador si es necesario

¡Una vez instaladas las dependencias, el sistema SMAF funcionará perfectamente! 🎉

