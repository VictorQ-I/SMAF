# SMAF ML Service

Microservicio de Machine Learning para detección de fraude del sistema SMAF.

## Características

- **Algoritmos**: Ensemble de Random Forest e Isolation Forest
- **API**: FastAPI con documentación automática
- **Métricas**: Integración con Prometheus
- **Logging**: Logging estructurado con structlog
- **Escalabilidad**: Containerizado con Docker

## Arquitectura del Modelo

### Random Forest Classifier
- Clasificación binaria (fraude/no fraude)
- Manejo de clases desbalanceadas
- 100 árboles de decisión

### Isolation Forest
- Detección de anomalías
- Identifica patrones inusuales
- Complementa la clasificación

### Features Utilizadas

1. **Features Básicas**:
   - `amount`: Monto de la transacción
   - `hour`: Hora del día (0-23)
   - `dayOfWeek`: Día de la semana (0-6)

2. **Features Categóricas**:
   - `mcc_high_risk`: MCC de alto riesgo
   - `country_high_risk`: País de alto riesgo
   - `bin_high_risk`: BIN de alto riesgo

3. **Features Derivadas**:
   - `is_night`: Transacción nocturna
   - `is_weekend`: Fin de semana
   - `is_high_amount`: Monto alto
   - `amount_log`: Logaritmo del monto

## API Endpoints

### POST /predict
Realiza predicción de fraude para una transacción.

**Request Body**:
```json
{
  "amount": 150000,
  "merchantCategoryCode": "5411",
  "countryCode": "CO",
  "hour": 14,
  "dayOfWeek": 2,
  "bin": "411111"
}
```

**Response**:
```json
{
  "risk_score": 25.5,
  "fraud_probability": 0.255,
  "confidence": 0.89,
  "model_version": "1.0.0",
  "features_used": ["amount", "hour", "mcc_high_risk"],
  "processing_time_ms": 12.5,
  "risk_level": "low",
  "decision_reason": "Transacción de bajo riesgo"
}
```

### GET /health
Verifica el estado del servicio.

### GET /model/info
Información sobre el modelo actual.

### GET /metrics
Métricas de Prometheus.

## Instalación y Uso

### Con Docker (Recomendado)

```bash
# Construir imagen
docker build -t smaf-ml-service .

# Ejecutar contenedor
docker run -p 5000:5000 smaf-ml-service
```

### Instalación Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servicio
python -m app.main
```

## Configuración

Copiar `env.example` a `.env` y configurar las variables:

```bash
# Servidor
PORT=5000
DEBUG=false

# Umbrales de riesgo
HIGH_RISK_THRESHOLD=0.7
MEDIUM_RISK_THRESHOLD=0.3
```

## Métricas y Monitoreo

### Métricas Disponibles

- `ml_predictions_total`: Total de predicciones realizadas
- `ml_prediction_duration_seconds`: Tiempo de procesamiento
- `ml_model_loads_total`: Cargas del modelo

### Logging

El servicio genera logs estructurados en formato JSON:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "event": "Predicción realizada",
  "risk_score": 75.5,
  "processing_time_ms": 12.5
}
```

## Desarrollo

### Estructura del Proyecto

```
ml-service/
├── app/
│   ├── main.py              # Aplicación FastAPI
│   ├── config.py            # Configuración
│   ├── models/
│   │   └── fraud_detector.py # Detector de fraude
│   └── schemas/
│       └── prediction.py     # Esquemas Pydantic
├── requirements.txt         # Dependencias
├── Dockerfile              # Imagen Docker
└── README.md               # Documentación
```

### Agregar Nuevas Features

1. Actualizar `PredictionRequest.to_features()`
2. Regenerar datos de entrenamiento
3. Reentrenar modelo con `/retrain`

### Reentrenamiento

El modelo se puede reentrenar dinámicamente:

```bash
curl -X POST http://localhost:5000/retrain
```

## Seguridad

- Validación estricta de entrada
- Rate limiting (configurado en API Gateway)
- Logging de todas las predicciones
- Métricas de seguridad

## Performance

- **Latencia**: < 50ms por predicción
- **Throughput**: > 1000 predicciones/segundo
- **Memoria**: ~200MB en uso normal

## Testing

```bash
# Test básico
curl -X POST "http://localhost:5000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150000,
    "merchantCategoryCode": "5411",
    "countryCode": "CO",
    "hour": 14,
    "dayOfWeek": 2,
    "bin": "411111"
  }'
```




