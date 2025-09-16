-- SMAF Database Initialization Script

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar timezone
SET timezone = 'America/Bogota';

-- Crear usuario de aplicación si no existe
DO $$ 
BEGIN 
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'smaf_app') THEN
      CREATE ROLE smaf_app LOGIN PASSWORD 'smaf_app_password';
   END IF;
END
$$;

-- Otorgar permisos
GRANT CONNECT ON DATABASE smaf_db TO smaf_app;
GRANT USAGE ON SCHEMA public TO smaf_app;
GRANT CREATE ON SCHEMA public TO smaf_app;

-- Configurar permisos por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO smaf_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO smaf_app;

-- Crear índices adicionales para performance (se ejecutarán después de que TypeORM cree las tablas)
-- Estos comandos se ejecutarán condicionalmente

-- Función para crear índices si las tablas existen
CREATE OR REPLACE FUNCTION create_performance_indexes() RETURNS void AS $$
BEGIN
  -- Índices para transacciones
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_created_at_desc 
      ON transactions (created_at DESC);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_amount_risk 
      ON transactions (amount, risk_score);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_country_date 
      ON transactions (country_code, created_at);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_merchant_date 
      ON transactions (merchant_id, created_at);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_card_partial 
      ON transactions (substring(card_number, 1, 6));
  END IF;

  -- Índices para audit logs
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at_desc 
      ON audit_logs (created_at DESC);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action 
      ON audit_logs (user_id, action);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity 
      ON audit_logs (entity_type, entity_id);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_risk_level 
      ON audit_logs (risk_level, created_at);
  END IF;

  -- Índices para reglas
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rules') THEN
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rules_status_priority 
      ON rules (status, priority DESC);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rules_type_status 
      ON rules (type, status);
  END IF;

  -- Índices para usuarios
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status 
      ON users (role, status);
    
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login 
      ON users (last_login_at DESC);
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Configuraciones de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET log_statement = 'ddl';

-- Configurar autovacuum para tablas de alta frecuencia
-- (Se aplicará después de que las tablas sean creadas)

-- Crear función para configurar autovacuum
CREATE OR REPLACE FUNCTION configure_autovacuum() RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
    ALTER TABLE transactions SET (
      autovacuum_vacuum_scale_factor = 0.1,
      autovacuum_analyze_scale_factor = 0.05,
      autovacuum_vacuum_threshold = 1000,
      autovacuum_analyze_threshold = 1000
    );
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    ALTER TABLE audit_logs SET (
      autovacuum_vacuum_scale_factor = 0.1,
      autovacuum_analyze_scale_factor = 0.05,
      autovacuum_vacuum_threshold = 2000,
      autovacuum_analyze_threshold = 1000
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear función para estadísticas de la base de datos
CREATE OR REPLACE FUNCTION get_db_stats() RETURNS TABLE (
  table_name text,
  row_count bigint,
  table_size text,
  index_size text,
  total_size text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins - n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size
  FROM pg_stat_user_tables 
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Mensaje de confirmación
SELECT 'SMAF Database initialized successfully' as status;




