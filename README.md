# SMAF - Sistema Motor Antifraude

Sistema antifraude financiero basado en microservicios para detectar y prevenir transacciones fraudulentas en tiempo real para franquicias Visa y MasterCard.

## Arquitectura

- **Backend**: NestJS con TypeScript
- **Base de datos**: PostgreSQL con TypeORM
- **Frontend**: React con dashboard para analistas
- **ML Service**: Python con FastAPI
- **Infraestructura**: Docker y docker-compose

## Estructura del Proyecto

```
SMAF/
├── backend/                 # API Gateway y servicios NestJS
├── frontend/               # Dashboard React
├── ml-service/             # Microservicio de Machine Learning
├── docker-compose.yml      # Orquestación de servicios
└── README.md
```

## Requisitos Funcionales

- Captura y registro de transacciones (API REST)
- Motor de reglas configurable
- Motor de analítica/ML
- Módulo de decisión híbrida
- Clasificación automática de transacciones
- Panel de monitoreo para analistas
- Auditoría y trazabilidad completa

## Requisitos No Funcionales

- Tiempo de respuesta < 100 ms
- Escalabilidad horizontal
- Cumplimiento PCI-DSS y GDPR
- Disponibilidad 99.9%

## Roles

- **Cliente**: Realiza transacciones
- **Analista**: Recibe alertas, ve gráficas y aprueba/rechaza transacciones
- **Líder de Analistas**: Supervisa, valida y descarga reportes
- **Administrador TI**: Acceso total del software

## Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd SMAF

# Ejecutar con Docker
docker-compose up -d
```

## Desarrollo

Cada servicio tiene su propio directorio con instrucciones específicas de desarrollo.

