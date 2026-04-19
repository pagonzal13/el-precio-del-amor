-- ============================================================
-- El Precio del Amor – Init SQL (corre automáticamente al
-- primer arranque del contenedor de PostgreSQL)
-- ============================================================

-- Crear schema expuesto por PostgREST
CREATE SCHEMA IF NOT EXISTS api;

-- Tabla de gastos (en schema api para que PostgREST la exponga)
CREATE TABLE IF NOT EXISTS api.expenses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT now(),

  purpose         TEXT NOT NULL,
  nickname        TEXT,
  amount          NUMERIC(10, 2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'EUR',
  who_paid        TEXT NOT NULL CHECK (who_paid IN ('Capa', 'Pau')),

  split_type      TEXT NOT NULL DEFAULT 'equal'
                  CHECK (split_type IN ('equal', 'solo', 'custom')),
  for_whom        TEXT[] NOT NULL DEFAULT '{}',
  split_amounts   NUMERIC(10,2)[] DEFAULT '{}',

  category        TEXT NOT NULL DEFAULT 'Otros'
                  CHECK (category IN (
                    'Bebidas y comidas',
                    'Ocio, cultura, entradas...',
                    'Viajes',
                    'Hogar',
                    'Transporte',
                    'Otros'
                  )),

  date            TIMESTAMPTZ NOT NULL DEFAULT now(),
  include_in_balance BOOLEAN NOT NULL DEFAULT false
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_expenses_date     ON api.expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_who_paid ON api.expenses (who_paid);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON api.expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_balance  ON api.expenses (include_in_balance);

-- Rol que usará PostgREST para conectarse (sin contraseña, solo acceso local)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'web_anon') THEN
    CREATE ROLE web_anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'postgrest_pass';
  END IF;
END
$$;

GRANT USAGE  ON SCHEMA api        TO web_anon;
GRANT ALL    ON api.expenses       TO web_anon;
GRANT web_anon TO authenticator;
