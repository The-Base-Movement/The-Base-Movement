-- 🚩 THE BASE: PREMIUM STOREFRONT OPTIMIZATION
-- Enhances the store schema for high-fidelity Product Detail Pages (PDP).

-- 1. Extend store_inventory with premium fields
ALTER TABLE public.store_inventory 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customization_allowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;

-- 2. Create Product Images table for multi-image galleries
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.store_inventory(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Patriot Reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.store_inventory(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    patriot_name TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Allow public read for product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Allow public read for product reviews" ON public.product_reviews FOR SELECT USING (true);
CREATE POLICY "Allow authenticated patriots to write reviews" ON public.product_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
