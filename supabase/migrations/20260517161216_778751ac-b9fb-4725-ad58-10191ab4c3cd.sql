ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_size_key;

-- NULLs are distinct in UNIQUE by default; coalesce color to '' via a unique index on expressions
DROP INDEX IF EXISTS product_variants_product_id_size_color_key;
CREATE UNIQUE INDEX product_variants_product_id_size_color_key
  ON public.product_variants (product_id, size, COALESCE(color, ''));