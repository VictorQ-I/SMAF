# SMAF - Guía de Despliegue

Esta guía te ayudará a desplegar el Sistema Motor Antifraude (SMAF) en tu entorno.

## 📋 Prerrequisitos

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git**
- **Puerto 80, 3000, 3001, 5000, 5432, 6379** disponibles

## 🚀 Instalación Rápida

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd SMAF
```

### 2. Configurar Variables de Entorno
```bash
# Backend
cp backend/env.example backend/.env

# ML Service
cp ml-service/env.example ml-service/.env

# Editar las variables según tu entorno
nano backend/.env
nano ml-service/.env
```

### 3. Iniciar el Sistema
```bash
# Opción 1: Usando Makefile (recomendado)
make start

# Opción 2: Usando script de inicio
./scripts/start.sh

# Opción 3: Usando Docker Compose directamente
docker-compose up -d
```

### 4. Verificar el Despliegue
```bash
# Ver estado de servicios
make status

# Ver logs
make logs
```

## 🌐 Acceder al Sistema

Una vez desplegado, puedes acceder a:

- **🌐 Frontend (Dashboard)**: http://localhost:3001
- **🔧 API Backend**: http://localhost:3000
- **📚 API Docs**: http://localhost:3000/api/docs
- **🤖 ML Service**: http://localhost:5000
- **📊 Grafana**: http://localhost:3002 (admin/admin123)
- **📈 Prometheus**: http://localhost:9090

## 👤 Credenciales de Demostración

```
Administrador:
  Email: admin@smaf.com
  Password: admin123

Líder Analista:
  Email: leader@smaf.com
  Password: leader123

Analista:
  Email: analyst@smaf.com
  Password: analyst123
```

## 🔧 Configuración Avanzada

### Variables de Entorno Importantes

#### Backend (.env)
```bash
# Base de datos
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=smaf_user
DB_PASSWORD=smaf_password
DB_DATABASE=smaf_db

# JWT
JWT_SECRET=tu_secreto_jwt_super_seguro
JWT_EXPIRATION=24h

# ML Service
ML_SERVICE_URL=http://ml-service:5000

# Seguridad
ENCRYPTION_KEY=tu_clave_de_encriptacion_32_caracteres
```

#### ML Service (.env)
```bash
# Servidor
PORT=5000
DEBUG=false
LOG_LEVEL=INFO

# Umbrales de riesgo
HIGH_RISK_THRESHOLD=0.7
MEDIUM_RISK_THRESHOLD=0.3
```

### Configuración de Base de Datos

El sistema usa PostgreSQL con las siguientes características:
- **Usuario**: smaf_user
- **Contraseña**: smaf_password
- **Base de datos**: smaf_db
- **Puerto**: 5432

### Configuración de Redis

Para cache y sesiones:
- **Puerto**: 6379
- **Contraseña**: smaf_redis_password

## 🐳 Comandos Docker Útiles

```bash
# Ver contenedores en ejecución
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f ml-service
docker-compose logs -f frontend

# Reiniciar un servicio
docker-compose restart backend

# Ejecutar comando en contenedor
docker-compose exec backend npm run test
docker-compose exec postgres psql -U smaf_user smaf_db

# Actualizar imágenes
docker-compose pull
docker-compose up -d --force-recreate
```

## 📊 Monitoreo y Logs

### Prometheus
- URL: http://localhost:9090
- Métricas disponibles:
  - `ml_predictions_total`
  - `ml_prediction_duration_seconds`
  - `http_requests_total`

### Grafana
- URL: http://localhost:3002
- Usuario: admin
- Contraseña: admin123

### Logs
```bash
# Todos los servicios
make logs

# Servicio específico
make logs-backend
make logs-ml
make logs-frontend
make logs-db
```

## 🔒 Seguridad

### Recomendaciones para Producción

1. **Cambiar todas las contraseñas por defecto**
2. **Configurar SSL/TLS**
3. **Configurar firewall**
4. **Habilitar autenticación MFA**
5. **Revisar configuración de CORS**
6. **Configurar backups automáticos**

### Variables de Seguridad
```bash
# Generar secreto JWT seguro
openssl rand -base64 32

# Generar clave de encriptación
openssl rand -hex 32
```

## 📈 Escalabilidad

### Escalado Horizontal
```bash
# Escalar backend
docker-compose up -d --scale backend=3

# Escalar ML service
docker-compose up -d --scale ml-service=2
```

### Configuración de Load Balancer
Para producción, configura un load balancer (nginx, HAProxy) delante de los servicios.

## 🛠️ Mantenimiento

### Backup de Base de Datos
```bash
# Crear backup
make backup-db

# Restaurar backup
docker-compose exec -T postgres psql -U smaf_user smaf_db < backup_file.sql
```

### Actualización del Sistema
```bash
# Parar servicios
make stop

# Actualizar código
git pull

# Reconstruir imágenes
make build

# Iniciar servicios
make start
```

### Limpieza del Sistema
```bash
# Limpiar contenedores y volúmenes
make clean

# Limpieza completa (incluye imágenes)
make clean-all
```

## 🐛 Resolución de Problemas

### Problemas Comunes

#### Error de Puerto en Uso
```bash
# Verificar puertos en uso
netstat -tulpn | grep :3000

# Matar proceso usando puerto
sudo kill -9 $(sudo lsof -t -i:3000)
```

#### Base de Datos no se Conecta
```bash
# Verificar estado de PostgreSQL
docker-compose logs postgres

# Reiniciar base de datos
docker-compose restart postgres
```

#### ML Service no Responde
```bash
# Verificar logs del ML service
docker-compose logs ml-service

# Verificar salud del servicio
curl http://localhost:5000/health
```

### Logs de Debug
```bash
# Habilitar logs de debug
export DEBUG=true

# Ver logs detallados
docker-compose logs -f --tail=100
```

## 📞 Soporte

Para problemas o preguntas:

1. **Verificar logs**: `make logs`
2. **Revisar documentación**: Consultar README.md
3. **Issues**: Crear issue en el repositorio
4. **Contacto**: Contactar al equipo de desarrollo

## 🔄 Proceso de Despliegue en Producción

### 1. Preparación
```bash
# Configurar variables de producción
cp backend/env.example backend/.env.production
cp ml-service/env.example ml-service/.env.production

# Editar configuraciones de producción
nano backend/.env.production
nano ml-service/.env.production
```

### 2. Construcción
```bash
# Construir imágenes optimizadas
docker-compose -f docker-compose.prod.yml build --no-cache
```

### 3. Despliegue
```bash
# Desplegar en producción
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Verificación
```bash
# Verificar todos los servicios
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs
```

¡El sistema SMAF está listo para usar! 🎉




