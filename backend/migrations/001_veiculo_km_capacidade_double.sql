-- Altera km_atual e capacidade_tanque de INTEGER para DOUBLE PRECISION
-- para aceitar valores decimais (ex: 34.25 km, 45.5 litros).
-- Execute no banco: psql -U seu_usuario -d sua_base -f migrations/001_veiculo_km_capacidade_double.sql

ALTER TABLE veiculo
  ALTER COLUMN km_atual TYPE DOUBLE PRECISION USING km_atual::double precision;

ALTER TABLE veiculo
  ALTER COLUMN capacidade_tanque TYPE DOUBLE PRECISION USING capacidade_tanque::double precision;
