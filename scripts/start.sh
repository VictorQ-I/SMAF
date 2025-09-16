#!/bin/bash

# SMAF - Script de inicio del sistema
set -e

echo "🚀 Iniciando sistema SMAF..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar que Docker esté disponible
if ! command -v docker &> /dev/null; then
    error "Docker no está instalado o no está en PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose no está instalado o no está en PATH"
    exit 1
fi

# Verificar que Docker esté ejecutándose
if ! docker info &> /dev/null; then
    error "Docker no está ejecutándose. Por favor, inicia Docker primero."
    exit 1
fi

# Crear directorios necesarios si no existen
log "Creando directorios necesarios..."
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p backend/logs
mkdir -p ml-service/logs
mkdir -p ml-service/models
mkdir -p ml-service/data

# Verificar archivos de configuración
log "Verificando archivos de configuración..."

if [ ! -f "docker-compose.yml" ]; then
    error "docker-compose.yml no encontrado"
    exit 1
fi

if [ ! -f "backend/package.json" ]; then
    error "backend/package.json no encontrado"
    exit 1
fi

if [ ! -f "ml-service/requirements.txt" ]; then
    error "ml-service/requirements.txt no encontrado"
    exit 1
fi

# Configurar variables de entorno si no existen
if [ ! -f "backend/.env" ]; then
    warn "Archivo backend/.env no encontrado, copiando desde ejemplo..."
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
    else
        warn "backend/env.example tampoco encontrado"
    fi
fi

if [ ! -f "ml-service/.env" ]; then
    warn "Archivo ml-service/.env no encontrado, copiando desde ejemplo..."
    if [ -f "ml-service/env.example" ]; then
        cp ml-service/env.example ml-service/.env
    else
        warn "ml-service/env.example tampoco encontrado"
    fi
fi

# Modo de inicio (desarrollo o producción)
MODE=${1:-"dev"}

if [ "$MODE" = "prod" ]; then
    log "Iniciando en modo PRODUCCIÓN..."
    COMPOSE_FILE="docker-compose.yml"
else
    log "Iniciando en modo DESARROLLO..."
    COMPOSE_FILE="docker-compose.yml"
fi

# Detener servicios existentes si están ejecutándose
log "Deteniendo servicios existentes..."
docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true

# Limpiar volúmenes si se especifica
if [ "$2" = "--clean" ]; then
    warn "Limpiando volúmenes existentes..."
    docker-compose -f $COMPOSE_FILE down -v
    docker system prune -f
fi

# Construir imágenes
log "Construyendo imágenes Docker..."
docker-compose -f $COMPOSE_FILE build --no-cache

# Iniciar servicios base primero (base de datos, cache)
log "Iniciando servicios base..."
docker-compose -f $COMPOSE_FILE up -d postgres redis

# Esperar a que la base de datos esté lista
log "Esperando a que PostgreSQL esté listo..."
timeout=60
counter=0
while ! docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U smaf_user -d smaf_db; do
    sleep 2
    counter=$((counter+2))
    if [ $counter -ge $timeout ]; then
        error "Timeout esperando PostgreSQL"
        exit 1
    fi
done

log "PostgreSQL está listo ✅"

# Esperar a que Redis esté listo
log "Esperando a que Redis esté listo..."
counter=0
while ! docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping; do
    sleep 2
    counter=$((counter+2))
    if [ $counter -ge $timeout ]; then
        error "Timeout esperando Redis"
        exit 1
    fi
done

log "Redis está listo ✅"

# Iniciar servicio de ML
log "Iniciando servicio de ML..."
docker-compose -f $COMPOSE_FILE up -d ml-service

# Esperar a que el servicio ML esté listo
log "Esperando a que el servicio ML esté listo..."
counter=0
while ! curl -f http://localhost:5000/health &>/dev/null; do
    sleep 3
    counter=$((counter+3))
    if [ $counter -ge $timeout ]; then
        error "Timeout esperando servicio ML"
        exit 1
    fi
done

log "Servicio ML está listo ✅"

# Iniciar backend
log "Iniciando backend..."
docker-compose -f $COMPOSE_FILE up -d backend

# Esperar a que el backend esté listo
log "Esperando a que el backend esté listo..."
counter=0
while ! curl -f http://localhost:3000/health &>/dev/null; do
    sleep 3
    counter=$((counter+3))
    if [ $counter -ge $timeout ]; then
        error "Timeout esperando backend"
        exit 1
    fi
done

log "Backend está listo ✅"

# Iniciar frontend y servicios restantes
log "Iniciando frontend y servicios de monitoreo..."
docker-compose -f $COMPOSE_FILE up -d

# Verificar que todos los servicios estén ejecutándose
log "Verificando estado de los servicios..."
sleep 10

if docker-compose -f $COMPOSE_FILE ps | grep -q "Exit"; then
    error "Algunos servicios fallaron al iniciar:"
    docker-compose -f $COMPOSE_FILE ps
    exit 1
fi

# Mostrar información de los servicios
echo ""
echo -e "${BLUE}=== SMAF Sistema Iniciado Exitosamente ===${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend (Dashboard):${NC} http://localhost:3001"
echo -e "${GREEN}🔧 API Backend:${NC} http://localhost:3000"
echo -e "${GREEN}📚 API Docs:${NC} http://localhost:3000/api/docs"
echo -e "${GREEN}🤖 ML Service:${NC} http://localhost:5000"
echo -e "${GREEN}📊 Grafana:${NC} http://localhost:3002 (admin/admin123)"
echo -e "${GREEN}📈 Prometheus:${NC} http://localhost:9090"
echo -e "${GREEN}🔄 Nginx:${NC} http://localhost"
echo ""
echo -e "${YELLOW}📋 Para ver logs:${NC} docker-compose logs -f [servicio]"
echo -e "${YELLOW}🛑 Para detener:${NC} docker-compose down"
echo -e "${YELLOW}📊 Estado:${NC} docker-compose ps"
echo ""

# Mostrar logs en tiempo real si se solicita
if [ "$3" = "--logs" ]; then
    log "Mostrando logs en tiempo real (Ctrl+C para salir)..."
    docker-compose -f $COMPOSE_FILE logs -f
fi




