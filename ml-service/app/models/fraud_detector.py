import os
import time
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from ..config import settings

class FraudDetector:
    """
    Detector de fraude usando algoritmos de Machine Learning
    Combina Isolation Forest para detección de anomalías y Random Forest para clasificación
    """
    
    def __init__(self):
        self.isolation_forest: Optional[IsolationForest] = None
        self.random_forest: Optional[RandomForestClassifier] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names: List[str] = []
        self.model_version: str = "1.0.0"
        self.training_date: Optional[datetime] = None
        self.model_metrics: Dict[str, float] = {}
        
        # Cargar modelo existente o entrenar uno nuevo
        self._load_or_train_model()
    
    def _load_or_train_model(self):
        """Carga modelo existente o entrena uno nuevo si no existe"""
        model_path = os.path.join(settings.MODEL_PATH, settings.MODEL_NAME)
        
        if os.path.exists(model_path):
            self._load_model(model_path)
        else:
            # Entrenar modelo con datos simulados
            self._train_with_simulated_data()
            self._save_model(model_path)
    
    def _load_model(self, model_path: str):
        """Carga modelo desde archivo"""
        try:
            model_data = joblib.load(model_path)
            
            self.isolation_forest = model_data['isolation_forest']
            self.random_forest = model_data['random_forest']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            self.model_version = model_data.get('model_version', '1.0.0')
            self.training_date = model_data.get('training_date')
            self.model_metrics = model_data.get('model_metrics', {})
            
            print(f"Modelo cargado exitosamente desde {model_path}")
            
        except Exception as e:
            print(f"Error cargando modelo: {e}")
            self._train_with_simulated_data()
    
    def _save_model(self, model_path: str):
        """Guarda modelo en archivo"""
        try:
            model_data = {
                'isolation_forest': self.isolation_forest,
                'random_forest': self.random_forest,
                'scaler': self.scaler,
                'feature_names': self.feature_names,
                'model_version': self.model_version,
                'training_date': self.training_date,
                'model_metrics': self.model_metrics
            }
            
            joblib.dump(model_data, model_path)
            print(f"Modelo guardado en {model_path}")
            
        except Exception as e:
            print(f"Error guardando modelo: {e}")
    
    def _train_with_simulated_data(self):
        """Entrena modelo con datos simulados"""
        print("Entrenando modelo con datos simulados...")
        
        # Generar datos simulados
        train_data = self._generate_simulated_data(10000)
        
        # Preparar features y targets
        feature_columns = [col for col in train_data.columns if col != 'is_fraud']
        X = train_data[feature_columns]
        y = train_data['is_fraud']
        
        self.feature_names = feature_columns
        
        # Dividir datos
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Escalar features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Entrenar Isolation Forest para detección de anomalías
        self.isolation_forest = IsolationForest(
            contamination=0.1,  # 10% de datos considerados anómalos
            random_state=42,
            n_estimators=100
        )
        self.isolation_forest.fit(X_train_scaled)
        
        # Entrenar Random Forest para clasificación
        self.random_forest = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        self.random_forest.fit(X_train_scaled, y_train)
        
        # Evaluar modelo
        y_pred = self.random_forest.predict(X_test_scaled)
        
        self.model_metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred)
        }
        
        self.training_date = datetime.now()
        
        print(f"Modelo entrenado - Accuracy: {self.model_metrics['accuracy']:.3f}")
    
    def _generate_simulated_data(self, n_samples: int) -> pd.DataFrame:
        """Genera datos simulados para entrenamiento"""
        np.random.seed(42)
        
        data = []
        
        for _ in range(n_samples):
            # Generar transacción base
            transaction = {
                'amount': np.random.lognormal(10, 2),  # Distribución log-normal para montos
                'hour': np.random.randint(0, 24),
                'dayOfWeek': np.random.randint(0, 7),
                'mcc_high_risk': np.random.choice([0, 1], p=[0.9, 0.1]),
                'mcc_medium_risk': np.random.choice([0, 1], p=[0.8, 0.2]),
                'mcc_numeric': np.random.randint(1000, 9999),
                'country_high_risk': np.random.choice([0, 1], p=[0.95, 0.05]),
                'country_medium_risk': np.random.choice([0, 1], p=[0.85, 0.15]),
                'country_domestic': np.random.choice([0, 1], p=[0.3, 0.7]),
                'bin_high_risk': np.random.choice([0, 1], p=[0.98, 0.02]),
                'bin_numeric': np.random.randint(100000, 999999),
                'is_night': 0,
                'is_business_hours': 0,
                'is_weekend': 0,
                'is_friday': 0,
                'amount_log': 0,
                'is_high_amount': 0,
                'is_round_amount': 0,
            }
            
            # Calcular features derivadas
            transaction['is_night'] = 1 if transaction['hour'] >= 22 or transaction['hour'] <= 6 else 0
            transaction['is_business_hours'] = 1 if 8 <= transaction['hour'] <= 18 else 0
            transaction['is_weekend'] = 1 if transaction['dayOfWeek'] in [0, 6] else 0
            transaction['is_friday'] = 1 if transaction['dayOfWeek'] == 5 else 0
            transaction['amount_log'] = np.log(transaction['amount'] + 1)
            transaction['is_high_amount'] = 1 if transaction['amount'] >= 1000000 else 0
            transaction['is_round_amount'] = 1 if transaction['amount'] % 10000 == 0 else 0
            
            # Determinar si es fraude basado en reglas de riesgo
            fraud_score = 0
            
            # Factores de riesgo
            if transaction['country_high_risk']:
                fraud_score += 30
            if transaction['mcc_high_risk']:
                fraud_score += 25
            if transaction['is_night']:
                fraud_score += 15
            if transaction['is_high_amount']:
                fraud_score += 20
            if transaction['bin_high_risk']:
                fraud_score += 35
            
            # Agregar ruido aleatorio
            fraud_score += np.random.normal(0, 10)
            
            # Determinar etiqueta de fraude
            fraud_probability = 1 / (1 + np.exp(-fraud_score / 20))  # Función sigmoidea
            transaction['is_fraud'] = 1 if fraud_probability > 0.5 else 0
            
            data.append(transaction)
        
        return pd.DataFrame(data)
    
    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """Realiza predicción de fraude para una transacción"""
        start_time = time.time()
        
        try:
            # Convertir features a array numpy
            feature_vector = self._prepare_features(features)
            
            # Escalar features
            feature_vector_scaled = self.scaler.transform(feature_vector.reshape(1, -1))
            
            # Predicción con Isolation Forest (detección de anomalías)
            anomaly_score = self.isolation_forest.decision_function(feature_vector_scaled)[0]
            is_outlier = self.isolation_forest.predict(feature_vector_scaled)[0] == -1
            
            # Predicción con Random Forest (clasificación)
            fraud_probability = self.random_forest.predict_proba(feature_vector_scaled)[0][1]
            fraud_prediction = self.random_forest.predict(feature_vector_scaled)[0]
            
            # Combinar scores
            risk_score = self._calculate_combined_risk_score(
                fraud_probability, anomaly_score, is_outlier
            )
            
            # Calcular confianza basada en la consistencia de los modelos
            confidence = self._calculate_confidence(fraud_probability, is_outlier)
            
            processing_time = (time.time() - start_time) * 1000  # ms
            
            result = {
                'risk_score': float(risk_score),
                'fraud_probability': float(fraud_probability),
                'confidence': float(confidence),
                'model_version': self.model_version,
                'processing_time_ms': float(processing_time),
                'anomaly_score': float(anomaly_score),
                'is_outlier': bool(is_outlier)
            }
            
            return result
            
        except Exception as e:
            raise Exception(f"Error en predicción: {str(e)}")
    
    def _prepare_features(self, features: Dict[str, float]) -> np.ndarray:
        """Prepara features para predicción"""
        feature_vector = []
        
        for feature_name in self.feature_names:
            if feature_name in features:
                feature_vector.append(features[feature_name])
            else:
                # Valor por defecto si falta el feature
                feature_vector.append(0.0)
        
        return np.array(feature_vector)
    
    def _calculate_combined_risk_score(
        self, 
        fraud_probability: float, 
        anomaly_score: float, 
        is_outlier: bool
    ) -> float:
        """Calcula score de riesgo combinado"""
        
        # Score base del Random Forest (0-100)
        rf_score = fraud_probability * 100
        
        # Bonus por detección de anomalía
        anomaly_bonus = 20 if is_outlier else 0
        
        # Penalización/bonus por anomaly score
        # anomaly_score negativo = más anómalo
        anomaly_adjustment = max(-10, anomaly_score * 10)
        
        final_score = rf_score + anomaly_bonus - anomaly_adjustment
        
        # Limitar entre 0 y 100
        return max(0, min(100, final_score))
    
    def _calculate_confidence(self, fraud_probability: float, is_outlier: bool) -> float:
        """Calcula confianza de la predicción"""
        
        # Confianza basada en qué tan cerca está de los extremos
        rf_confidence = 2 * abs(fraud_probability - 0.5)  # 0 = indeciso, 1 = muy seguro
        
        # Si ambos modelos coinciden, aumentar confianza
        both_agree = (fraud_probability > 0.5 and is_outlier) or (fraud_probability <= 0.5 and not is_outlier)
        agreement_bonus = 0.2 if both_agree else 0
        
        final_confidence = min(1.0, rf_confidence + agreement_bonus)
        
        return final_confidence
    
    def retrain(self):
        """Reentrena el modelo con nuevos datos"""
        print("Reentrenando modelo...")
        self._train_with_simulated_data()
        
        # Actualizar versión
        version_parts = self.model_version.split('.')
        version_parts[-1] = str(int(version_parts[-1]) + 1)
        self.model_version = '.'.join(version_parts)
        
        # Guardar modelo actualizado
        model_path = os.path.join(settings.MODEL_PATH, settings.MODEL_NAME)
        self._save_model(model_path)
    
    def get_model_info(self) -> Dict[str, Any]:
        """Retorna información del modelo"""
        return {
            'model_name': 'SMAF Fraud Detector',
            'model_version': self.model_version,
            'training_date': self.training_date.isoformat() if self.training_date else None,
            'model_type': 'Ensemble (Random Forest + Isolation Forest)',
            'feature_count': len(self.feature_names),
            'features': self.feature_names,
            'metrics': self.model_metrics,
            'thresholds': {
                'high_risk': settings.HIGH_RISK_THRESHOLD,
                'medium_risk': settings.MEDIUM_RISK_THRESHOLD
            }
        }
    
    def get_model_version(self) -> str:
        """Retorna versión del modelo"""
        return self.model_version




