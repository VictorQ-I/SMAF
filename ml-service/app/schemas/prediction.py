from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator
import re

class PredictionRequest(BaseModel):
    """Esquema para solicitud de predicción de fraude"""
    
    amount: float = Field(..., gt=0, description="Monto de la transacción")
    merchantCategoryCode: str = Field(..., min_length=4, max_length=4, description="Código de categoría del comercio (MCC)")
    countryCode: str = Field(..., min_length=2, max_length=3, description="Código de país")
    hour: int = Field(..., ge=0, le=23, description="Hora de la transacción (0-23)")
    dayOfWeek: int = Field(..., ge=0, le=6, description="Día de la semana (0=Domingo, 6=Sábado)")
    bin: str = Field(..., min_length=6, max_length=6, description="Bank Identification Number")
    
    # Campos opcionales para análisis más avanzado
    ipAddress: Optional[str] = Field(None, description="Dirección IP del cliente")
    userAgent: Optional[str] = Field(None, description="User Agent del navegador")
    deviceFingerprint: Optional[str] = Field(None, description="Huella digital del dispositivo")
    
    @validator('merchantCategoryCode')
    def validate_mcc(cls, v):
        if not re.match(r'^\d{4}$', v):
            raise ValueError('MCC debe ser exactamente 4 dígitos')
        return v
    
    @validator('bin')
    def validate_bin(cls, v):
        if not re.match(r'^\d{6}$', v):
            raise ValueError('BIN debe ser exactamente 6 dígitos')
        return v
    
    @validator('countryCode')
    def validate_country_code(cls, v):
        v = v.upper()
        if not re.match(r'^[A-Z]{2,3}$', v):
            raise ValueError('Código de país debe ser 2 o 3 letras')
        return v
    
    def to_features(self) -> Dict[str, float]:
        """Convierte el request a features para el modelo ML"""
        
        # Features básicas numéricas
        features = {
            'amount': float(self.amount),
            'hour': float(self.hour),
            'dayOfWeek': float(self.dayOfWeek),
        }
        
        # Encoding de categorías
        features.update(self._encode_mcc(self.merchantCategoryCode))
        features.update(self._encode_country(self.countryCode))
        features.update(self._encode_bin(self.bin))
        
        # Features derivadas
        features.update(self._derive_time_features())
        features.update(self._derive_amount_features())
        
        return features
    
    def _encode_mcc(self, mcc: str) -> Dict[str, float]:
        """Codifica el MCC en features categóricas"""
        
        # Categorías de riesgo basadas en MCC
        high_risk_mccs = ['7995', '7801', '6010', '6011']  # Casinos, ATM, etc.
        medium_risk_mccs = ['5411', '5541', '5542']  # Gasolineras, etc.
        
        return {
            'mcc_high_risk': 1.0 if mcc in high_risk_mccs else 0.0,
            'mcc_medium_risk': 1.0 if mcc in medium_risk_mccs else 0.0,
            'mcc_numeric': float(int(mcc)),
        }
    
    def _encode_country(self, country: str) -> Dict[str, float]:
        """Codifica el país en features de riesgo"""
        
        high_risk_countries = ['VE', 'CU', 'IR', 'KP', 'SY']
        medium_risk_countries = ['BR', 'AR', 'PE', 'EC']
        
        return {
            'country_high_risk': 1.0 if country in high_risk_countries else 0.0,
            'country_medium_risk': 1.0 if country in medium_risk_countries else 0.0,
            'country_domestic': 1.0 if country == 'CO' else 0.0,
        }
    
    def _encode_bin(self, bin_code: str) -> Dict[str, float]:
        """Codifica el BIN en features"""
        
        # Simular clasificación de BINs (en producción viene de BD)
        high_risk_bins = ['123456', '654321']
        
        return {
            'bin_high_risk': 1.0 if bin_code in high_risk_bins else 0.0,
            'bin_numeric': float(int(bin_code)),
        }
    
    def _derive_time_features(self) -> Dict[str, float]:
        """Deriva features basadas en tiempo"""
        
        return {
            'is_night': 1.0 if self.hour >= 22 or self.hour <= 6 else 0.0,
            'is_business_hours': 1.0 if 8 <= self.hour <= 18 else 0.0,
            'is_weekend': 1.0 if self.dayOfWeek in [0, 6] else 0.0,
            'is_friday': 1.0 if self.dayOfWeek == 5 else 0.0,
        }
    
    def _derive_amount_features(self) -> Dict[str, float]:
        """Deriva features basadas en el monto"""
        
        return {
            'amount_log': float(self.amount).bit_length(),  # Log aproximado
            'is_high_amount': 1.0 if self.amount >= 1000000 else 0.0,  # 1M COP
            'is_round_amount': 1.0 if self.amount % 10000 == 0 else 0.0,  # Múltiplo de 10K
        }

class PredictionResponse(BaseModel):
    """Esquema para respuesta de predicción de fraude"""
    
    risk_score: float = Field(..., ge=0, le=100, description="Score de riesgo (0-100)")
    fraud_probability: float = Field(..., ge=0, le=1, description="Probabilidad de fraude (0-1)")
    confidence: float = Field(..., ge=0, le=1, description="Confianza del modelo (0-1)")
    model_version: str = Field(..., description="Versión del modelo utilizado")
    features_used: List[str] = Field(..., description="Lista de features utilizadas")
    processing_time_ms: float = Field(..., description="Tiempo de procesamiento en milisegundos")
    
    # Información adicional del análisis
    risk_level: str = Field(..., description="Nivel de riesgo: low, medium, high")
    decision_reason: str = Field(..., description="Razón principal de la decisión")
    
    class Config:
        schema_extra = {
            "example": {
                "risk_score": 75.5,
                "fraud_probability": 0.755,
                "confidence": 0.89,
                "model_version": "v1.2.3",
                "features_used": ["amount", "mcc_high_risk", "country_high_risk"],
                "processing_time_ms": 12.5,
                "risk_level": "high",
                "decision_reason": "Alto monto + MCC de riesgo + País sospechoso"
            }
        }

class ModelInfo(BaseModel):
    """Información sobre el modelo ML"""
    
    model_name: str
    model_version: str
    training_date: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    feature_count: int
    training_samples: int
    model_type: str
    
class HealthResponse(BaseModel):
    """Respuesta del endpoint de salud"""
    
    status: str
    service: str
    version: str
    model_loaded: bool
    timestamp: float




