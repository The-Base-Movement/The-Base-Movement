-- 1. Create Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES store_inventory(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, product_id)
);

-- 2. Configure RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own wishlist
CREATE POLICY "Users can view their own wishlist" 
ON wishlist FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist" 
ON wishlist FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist" 
ON wishlist FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Create Index for Performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
