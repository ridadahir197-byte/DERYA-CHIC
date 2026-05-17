ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS cta_text text;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS mobile_image_url text;
ALTER TABLE public.orders REPLICA IDENTITY FULL;