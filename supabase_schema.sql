-- ============================================================
-- El Precio del Amor – Supabase Schema
-- Ejecuta este SQL en: Supabase > SQL Editor > New query
-- ============================================================

-- Crear tabla principal de gastos
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT now(),

  purpose     TEXT NOT NULL,
  nickname    TEXT,                          -- apodo cariñoso opcional
  amount      NUMERIC(10, 2) NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'EUR',
  who_paid    TEXT NOT NULL CHECK (who_paid IN ('Capa', 'Pau')),

  split_type  TEXT NOT NULL DEFAULT 'equal'
              CHECK (split_type IN ('equal', 'solo', 'custom')),
  for_whom    TEXT[] NOT NULL DEFAULT '{}', -- ['Capa', 'Pau'] etc.
  split_amounts NUMERIC(10,2)[] DEFAULT '{}',

  category    TEXT NOT NULL DEFAULT 'Otros'
              CHECK (category IN (
                'Bebidas y comidas',
                'Ocio, cultura, entradas...',
                'Viajes',
                'Hogar',
                'Otros'
              )),

  date        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_who_paid ON expenses (who_paid);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_purpose ON expenses USING gin(to_tsvector('spanish', purpose));

-- Habilitar Row Level Security (RLS) – recomendado aunque la app es privada
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: permitir todo (la app es privada, no hay usuarios anónimos externos)
-- Si quieres restringir más, puedes añadir autenticación Supabase más adelante
CREATE POLICY "Allow all for app users"
  ON expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);
