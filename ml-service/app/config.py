import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Configuración del servidor
    PORT: int = 5000
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Configuración del modelo
    MODEL_PATH: str = "models"
    MODEL_NAME: str = "fraud_detector_v1.joblib"
    RETRAIN_INTERVAL_HOURS: int = 24
    
    # Configuración de datos
    DATA_PATH: str = "data"
    TRAINING_DATA_FILE: str = "training_data.csv"
    
    # Umbrales de detección
    HIGH_RISK_THRESHOLD: float = 0.7
    MEDIUM_RISK_THRESHOLD: float = 0.3
    
    # Configuración de features
    FEATURE_COLUMNS: List[str] = [
        "amount",
        "merchantCategoryCode",
        "countryCode",
        "hour",
        "dayOfWeek",
        "bin"
    ]
    
    # Configuración de logging
    LOG_FORMAT: str = "json"
    LOG_FILE: str = "logs/ml_service.log"
    
    # Configuración de métricas
    METRICS_ENABLED: bool = True
    PROMETHEUS_PORT: int = 8000
    
    # Variables de entorno
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Crear directorios si no existen
        os.makedirs(self.MODEL_PATH, exist_ok=True)
        os.makedirs(self.DATA_PATH, exist_ok=True)
        os.makedirs(os.path.dirname(self.LOG_FILE), exist_ok=True)

# Instancia global de configuración
settings = Settings()




