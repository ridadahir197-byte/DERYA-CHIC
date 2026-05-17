
DROP FUNCTION IF EXISTS public.decrement_variant_stock(uuid, text, text, integer);

CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS NULL OR NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RETURN NEW;
  END IF;

  UPDATE public.product_variants
     SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
   WHERE product_id = NEW.product_id
     AND COALESCE(size, '')  = COALESCE(NEW.size, '')
     AND COALESCE(color, '') = COALESCE(NEW.color, '');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock_on_order_item ON public.order_items;
CREATE TRIGGER trg_decrement_stock_on_order_item
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order_item();
