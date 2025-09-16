# SMAF - Sistema Motor Antifraude
# Makefile para manejo del proyecto

.PHONY: help build start stop clean logs status test install setup

# Variables
DOCKER_COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = smaf

# Detectar sistema operativo
ifeq ($(OS),Windows_NT)
    SHELL_EXT = .bat
    EXEC_PREFIX = 
else
    SHELL_EXT = .sh
    EXEC_PREFIX = ./
endif

# Ayuda por defecto
help:
	@echo "SMAF - Sistema Motor Antifraude"
	@echo "================================"
	@echo ""
	@echo "Comandos disponibles:"
	@echo "  make install    - Instalar dependencias"
	@echo "  make setup      - Configuración inicial"
	@echo "  make build      - Construir imágenes Docker"
	@echo "  make start      - Iniciar todos los servicios"
	@echo "  make start-dev  - Iniciar en modo desarrollo"
	@echo "  make stop       - Detener todos los servicios"
	@echo "  make restart    - Reiniciar servicios"
	@echo "  make logs       - Ver logs de todos los servicios"
	@echo "  make status     - Ver estado de servicios"
	@echo "  make clean      - Limpiar contenedores y volúmenes"
	@echo "  make test       - Ejecutar pruebas"
	@echo "  make lint       - Ejecutar linting"
	@echo ""

# Instalación de dependencias
install:
	@echo "📦 Instalando dependencias..."
	@echo "Verificando Docker..."
	@docker --version
	@docker-compose --version
	@echo "Docker está disponible ✅"

# Configuración inicial
setup: install
	@echo "⚙️  Configuración inicial del proyecto..."
	@if not exist "backend\.env" ( \
		echo "Creando backend/.env desde ejemplo..." && \
		copy "backend\env.example" "backend\.env" \
	)
	@if not exist "ml-service\.env" ( \
		echo "Creando ml-service/.env desde ejemplo..." && \
		copy "ml-service\env.example" "ml-service\.env" \
	)
	@if not exist "monitoring\grafana\dashboards" mkdir "monitoring\grafana\dashboards"
	@if not exist "monitoring\grafana\datasources" mkdir "monitoring\grafana\datasources"
	@echo "Configuración inicial completada ✅"

# Construir imágenes
build:
	@echo "🔨 Construyendo imágenes Docker..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) build --no-cache

# Iniciar servicios
start: setup
	@echo "🚀 Iniciando servicios SMAF..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d
	@echo ""
	@echo "=== SMAF Sistema Iniciado ==="
	@echo "🌐 Frontend: http://localhost:3001"
	@echo "🔧 API Backend: http://localhost:3000"
	@echo "📚 API Docs: http://localhost:3000/api/docs"
	@echo "🤖 ML Service: http://localhost:5000"
	@echo "📊 Grafana: http://localhost:3002"
	@echo "📈 Prometheus: http://localhost:9090"

# Iniciar en modo desarrollo
start-dev: setup
	@echo "🚀 Iniciando servicios SMAF en modo desarrollo..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d postgres redis ml-service
	@echo "Servicios base iniciados. Para desarrollo del backend/frontend, ejecutar localmente."

# Detener servicios
stop:
	@echo "🛑 Deteniendo servicios SMAF..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down
	@echo "Servicios detenidos ✅"

# Reiniciar servicios
restart: stop start

# Ver logs
logs:
	@echo "📋 Mostrando logs de servicios..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f

# Logs de un servicio específico
logs-backend:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f backend

logs-ml:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f ml-service

logs-frontend:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f frontend

logs-db:
	docker-compose -f $(DOCKER_COMPOSE_FILE) logs -f postgres

# Estado de servicios
status:
	@echo "📊 Estado de servicios SMAF:"
	docker-compose -f $(DOCKER_COMPOSE_FILE) ps

# Limpiar contenedores y volúmenes
clean:
	@echo "🧹 Limpiando contenedores y volúmenes..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down -v --remove-orphans
	docker system prune -f
	@echo "Limpieza completada ✅"

# Limpiar todo (incluyendo imágenes)
clean-all:
	@echo "🧹 Limpieza completa del proyecto..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) down -v --remove-orphans --rmi all
	docker system prune -a -f
	@echo "Limpieza completa terminada ✅"

# Ejecutar pruebas
test:
	@echo "🧪 Ejecutando pruebas..."
	@echo "Backend tests:"
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec backend npm test
	@echo "ML Service tests:"
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec ml-service python -m pytest

# Linting
lint:
	@echo "🔍 Ejecutando linting..."
	@echo "Backend linting:"
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec backend npm run lint
	@echo "Frontend linting:"
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec frontend npm run lint

# Backup de base de datos
backup-db:
	@echo "💾 Creando backup de base de datos..."
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec postgres pg_dump -U smaf_user smaf_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup creado ✅"

# Restaurar base de datos
restore-db:
	@echo "📥 Para restaurar backup, usar:"
	@echo "docker-compose exec -T postgres psql -U smaf_user smaf_db < backup_file.sql"

# Monitoreo de recursos
monitor:
	@echo "📊 Monitoreando recursos..."
	docker stats

# Acceder a contenedores
shell-backend:
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec backend /bin/sh

shell-ml:
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec ml-service /bin/bash

shell-db:
	docker-compose -f $(DOCKER_COMPOSE_FILE) exec postgres psql -U smaf_user smaf_db

# Información del proyecto
info:
	@echo "SMAF - Sistema Motor Antifraude"
	@echo "==============================="
	@echo "Versión: 1.0.0"
	@echo "Servicios:"
	@echo "  - Backend NestJS (Puerto 3000)"
	@echo "  - Frontend React (Puerto 3001)"
	@echo "  - ML Service Python (Puerto 5000)"
	@echo "  - PostgreSQL (Puerto 5432)"
	@echo "  - Redis (Puerto 6379)"
	@echo "  - Grafana (Puerto 3002)"
	@echo "  - Prometheus (Puerto 9090)"
	@echo ""
	@echo "Para más información: make help"

# Desarrollo local del backend
dev-backend:
	@echo "🔧 Iniciando desarrollo del backend..."
	cd backend && npm install && npm run start:dev

# Desarrollo local del frontend
dev-frontend:
	@echo "🎨 Iniciando desarrollo del frontend..."
	cd frontend && npm install && npm start

# Desarrollo local del ML service
dev-ml:
	@echo "🤖 Iniciando desarrollo del ML service..."
	cd ml-service && pip install -r requirements.txt && python -m app.main




