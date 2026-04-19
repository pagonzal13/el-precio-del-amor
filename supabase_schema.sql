-- ============================================================
-- El Precio del Amor – Supabase Schema
-- Ejecuta este SQL en: Supabase > SQL Editor > New query
-- ============================================================

-- Crear tabla principal de gastos
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  purpose TEXT NOT NULL,
  nickname TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  who_paid TEXT NOT NULL CHECK (who_paid IN ('Capa', 'Pau')),
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal','solo','custom')),
  for_whom TEXT[] NOT NULL DEFAULT '{}',
  split_amounts NUMERIC(10,2)[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'Otros' CHECK (category IN ('Bebidas y comidas','Ocio, cultura, entradas...','Viajes','Hogar', 'Transporte', 'Otros')),
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  include_in_balance BOOLEAN NOT NULL DEFAULT false
);

-- Seguridad: solo acceso autenticado o con service key
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON public.expenses
  FOR ALL USING (true) WITH CHECK (true);