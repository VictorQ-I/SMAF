#!/bin/bash

# SMAF - Script para detener el sistema
set -e

echo "🛑 Deteniendo sistema SMAF..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar argumentos
CLEAN_VOLUMES=false
CLEAN_IMAGES=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --clean-volumes)
      CLEAN_VOLUMES=true
      shift
      ;;
    --clean-images)
      CLEAN_IMAGES=true
      shift
      ;;
    --clean-all)
      CLEAN_VOLUMES=true
      CLEAN_IMAGES=true
      shift
      ;;
    *)
      echo "Uso: $0 [--clean-volumes] [--clean-images] [--clean-all]"
      echo "  --clean-volumes: Eliminar volúmenes de datos"
      echo "  --clean-images:  Eliminar imágenes Docker"
      echo "  --clean-all:     Eliminar volúmenes e imágenes"
      exit 1
      ;;
  esac
done

# Detener servicios gradualmente
log "Deteniendo frontend y servicios auxiliares..."
docker-compose stop frontend nginx grafana prometheus 2>/dev/null || true

log "Deteniendo backend..."
docker-compose stop backend 2>/dev/null || true

log "Deteniendo servicio ML..."
docker-compose stop ml-service 2>/dev/null || true

log "Deteniendo servicios base..."
docker-compose stop postgres redis 2>/dev/null || true

# Remover contenedores
log "Removiendo contenedores..."
docker-compose down --remove-orphans

# Limpiar volúmenes si se solicita
if [ "$CLEAN_VOLUMES" = true ]; then
    warn "Eliminando volúmenes de datos..."
    docker-compose down -v
    
    warn "Esto eliminará TODOS los datos incluyendo:"
    echo "  - Base de datos PostgreSQL"
    echo "  - Cache Redis"
    echo "  - Modelos ML entrenados"
    echo "  - Logs de aplicación"
    echo "  - Datos de Grafana y Prometheus"
    echo ""
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
        log "Volúmenes eliminados"
    else
        log "Operación cancelada"
    fi
fi

# Limpiar imágenes si se solicita
if [ "$CLEAN_IMAGES" = true ]; then
    warn "Eliminando imágenes Docker de SMAF..."
    
    # Eliminar imágenes específicas de SMAF
    docker images | grep "smaf" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true
    
    # Limpiar imágenes no utilizadas
    docker image prune -f
    
    log "Imágenes eliminadas"
fi

# Mostrar estadísticas finales
echo ""
echo -e "${GREEN}=== Sistema SMAF Detenido ===${NC}"
echo ""

# Verificar que no queden contenedores de SMAF ejecutándose
RUNNING_CONTAINERS=$(docker ps --filter "name=smaf" --format "table {{.Names}}\t{{.Status}}" | tail -n +2)

if [ -z "$RUNNING_CONTAINERS" ]; then
    log "✅ Todos los contenedores de SMAF han sido detenidos"
else
    warn "Contenedores aún ejecutándose:"
    echo "$RUNNING_CONTAINERS"
fi

# Mostrar uso de recursos
echo ""
echo -e "${YELLOW}📊 Uso de recursos después del apagado:${NC}"
echo "Contenedores activos: $(docker ps -q | wc -l)"
echo "Imágenes totales: $(docker images -q | wc -l)"
echo "Volúmenes totales: $(docker volume ls -q | wc -l)"

# Mostrar comandos útiles
echo ""
echo -e "${YELLOW}🔧 Comandos útiles:${NC}"
echo "Iniciar de nuevo: ./scripts/start.sh"
echo "Ver logs anteriores: docker-compose logs [servicio]"
echo "Limpiar sistema: docker system prune -a"
echo ""




