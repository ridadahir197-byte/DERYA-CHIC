
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);

INSERT INTO public.products (name, price, image_url, category, description) VALUES
('Onyx Tailored Coat', 489.00, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&q=80', 'Jackets', 'Architectural wool coat with sculpted shoulders. Cut from Italian double-faced wool for a clean, weightless silhouette.'),
('Eclipse Slip Dress', 329.00, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&q=80', 'Dresses', 'Bias-cut silk slip dress with a fluid drape. Hand-finished seams and a low cowl back.'),
('Void Cargo Jeans', 219.00, 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=900&q=80', 'Jeans', 'Heavyweight Japanese selvedge denim with utility pockets. Relaxed straight leg, garment-washed black.'),
('Neon Bomber 03', 549.00, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=80', 'Jackets', 'Technical bomber with reflective taping and neon-lined cuffs. A signature BADYSS silhouette.'),
('Mercury Maxi Dress', 399.00, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=900&q=80', 'Dresses', 'Liquid jersey maxi dress with a sculpted neckline. Designed to move.'),
('Carbon Wide Jeans', 249.00, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=900&q=80', 'Jeans', 'Wide-leg carbon-washed denim with a high rise. Soft hand, structured drape.'),
('Velvet Noir Blazer', 599.00, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&q=80', 'Jackets', 'Single-breasted blazer in deep velvet. Hand-tailored, signature lapel.'),
('Ivory Slip Mini', 289.00, 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=900&q=80', 'Dresses', 'Mini slip in ivory silk-satin. Adjustable straps, French seams.');
