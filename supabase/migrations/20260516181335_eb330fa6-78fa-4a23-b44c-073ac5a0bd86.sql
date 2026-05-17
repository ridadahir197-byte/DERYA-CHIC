ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS colors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_sizes boolean NOT NULL DEFAULT true;