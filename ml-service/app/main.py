import logging
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

import structlog
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

from .models.fraud_detector import FraudDetector
from .schemas.prediction import PredictionRequest, PredictionResponse
from .config import settings

# Configurar logging estructurado
structlog.configure(
    processors=[
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Métricas de Prometheus
PREDICTION_COUNTER = Counter('ml_predictions_total', 'Total number of predictions made', ['result'])
PREDICTION_DURATION = Histogram('ml_prediction_duration_seconds', 'Time spent on predictions')
MODEL_LOAD_COUNTER = Counter('ml_model_loads_total', 'Total number of model loads')

# Variable global para el detector de fraude
fraud_detector: FraudDetector = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la aplicación"""
    global fraud_detector
    
    # Startup
    logger.info("Iniciando servicio de ML...")
    try:
        fraud_detector = FraudDetector()
        MODEL_LOAD_COUNTER.inc()
        logger.info("Modelo de detección de fraude cargado exitosamente")
    except Exception as e:
        logger.error("Error cargando modelo", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("Deteniendo servicio de ML...")

app = FastAPI(
    title="SMAF ML Service",
    description="Microservicio de Machine Learning para detección de fraude",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware para logging de requests"""
    start_time = time.time()
    
    # Log de request
    logger.info(
        "Request iniciado",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host
    )
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Log de response
        logger.info(
            "Request completado",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time=process_time
        )
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            "Request falló",
            method=request.method,
            url=str(request.url),
            error=str(e),
            process_time=process_time
        )
        raise

@app.get("/health")
async def health_check():
    """Endpoint de salud del servicio"""
    global fraud_detector
    
    if fraud_detector is None:
        raise HTTPException(status_code=503, detail="Modelo no está disponible")
    
    return {
        "status": "healthy",
        "service": "SMAF ML Service",
        "version": "1.0.0",
        "model_loaded": fraud_detector is not None,
        "timestamp": time.time()
    }

@app.get("/metrics")
async def metrics():
    """Endpoint de métricas para Prometheus"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/predict", response_model=PredictionResponse)
async def predict_fraud(request: PredictionRequest):
    """
    Predice la probabilidad de fraude para una transacción
    """
    global fraud_detector
    
    if fraud_detector is None:
        PREDICTION_COUNTER.labels(result="error").inc()
        raise HTTPException(status_code=503, detail="Modelo no está disponible")
    
    try:
        with PREDICTION_DURATION.time():
            # Convertir request a features
            features = request.to_features()
            
            # Realizar predicción
            prediction_result = fraud_detector.predict(features)
            
            # Log de predicción
            logger.info(
                "Predicción realizada",
                transaction_features=features,
                risk_score=prediction_result["risk_score"],
                fraud_probability=prediction_result["fraud_probability"],
                model_version=prediction_result["model_version"]
            )
            
            PREDICTION_COUNTER.labels(result="success").inc()
            
            return PredictionResponse(
                risk_score=prediction_result["risk_score"],
                fraud_probability=prediction_result["fraud_probability"],
                confidence=prediction_result["confidence"],
                model_version=prediction_result["model_version"],
                features_used=list(features.keys()),
                processing_time_ms=prediction_result["processing_time_ms"]
            )
            
    except Exception as e:
        PREDICTION_COUNTER.labels(result="error").inc()
        logger.error("Error en predicción", error=str(e), request_data=request.dict())
        raise HTTPException(status_code=500, detail=f"Error en predicción: {str(e)}")

@app.post("/retrain")
async def retrain_model():
    """
    Endpoint para reentrenar el modelo (solo para desarrollo/testing)
    """
    global fraud_detector
    
    try:
        logger.info("Iniciando reentrenamiento de modelo")
        
        if fraud_detector is None:
            fraud_detector = FraudDetector()
        
        # Simular reentrenamiento
        fraud_detector.retrain()
        MODEL_LOAD_COUNTER.inc()
        
        logger.info("Modelo reentrenado exitosamente")
        
        return {
            "status": "success",
            "message": "Modelo reentrenado exitosamente",
            "model_version": fraud_detector.get_model_version(),
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error("Error en reentrenamiento", error=str(e))
        raise HTTPException(status_code=500, detail=f"Error reentrenando modelo: {str(e)}")

@app.get("/model/info")
async def get_model_info():
    """
    Información sobre el modelo actual
    """
    global fraud_detector
    
    if fraud_detector is None:
        raise HTTPException(status_code=503, detail="Modelo no está disponible")
    
    try:
        model_info = fraud_detector.get_model_info()
        return model_info
    except Exception as e:
        logger.error("Error obteniendo información del modelo", error=str(e))
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/")
async def root():
    """Endpoint raíz con información del servicio"""
    return {
        "service": "SMAF ML Service",
        "description": "Microservicio de Machine Learning para detección de fraude",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "metrics": "/metrics",
            "model_info": "/model/info",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        log_level=settings.LOG_LEVEL.lower(),
        reload=settings.DEBUG
    )




