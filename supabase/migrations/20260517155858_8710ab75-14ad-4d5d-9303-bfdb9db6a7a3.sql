
-- 1. Add color column to product_variants (nullable; empty/null = "no color")
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS color text;

-- 2. Index to speed up lookups by product+color+size
CREATE INDEX IF NOT EXISTS idx_product_variants_product_color_size
  ON public.product_variants (product_id, color, size);

-- 3. RPC: decrement variant stock atomically
--    Matches by product_id + (size OR '') + (color OR '').
--    Returns the new stock value, or -1 if no matching variant exists.
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  _product_id uuid,
  _size text,
  _color text,
  _qty integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_qty integer;
BEGIN
  UPDATE public.product_variants
     SET stock_quantity = GREATEST(0, stock_quantity - _qty)
   WHERE product_id = _product_id
     AND COALESCE(size, '') = COALESCE(_size, '')
     AND COALESCE(color, '') = COALESCE(_color, '')
  RETURNING stock_quantity INTO new_qty;

  IF new_qty IS NULL THEN
    RETURN -1;
  END IF;
  RETURN new_qty;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, text, text, integer) TO anon, authenticated;
