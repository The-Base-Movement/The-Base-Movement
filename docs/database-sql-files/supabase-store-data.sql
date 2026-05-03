-- STORE DATA FOR THE BASE MOVEMENT
-- Execute this in your Supabase SQL Editor to populate the store.

INSERT INTO store_inventory (name, slug, category, price_ghs, stock_quantity, status, description, rating, image_url) VALUES
(
    'The Base Premium T-Shirt', 
    'premium-t-shirt', 
    'Apparel', 
    85.00, 
    100, 
    'Available', 
    '100% heavy cotton with high-density movement branding.', 
    4.9,
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800'
),
(
    'Ghana First Signature Cap', 
    'signature-cap', 
    'Accessories', 
    55.00, 
    50, 
    'Available', 
    'Structured 6-panel cap with premium 3D embroidery.', 
    4.8,
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800'
),
(
    'Patriotic Movement Wristband', 
    'movement-wristband', 
    'Accessories', 
    15.00, 
    500, 
    'Available', 
    'Eco-friendly silicone with debossed movement slogan.', 
    4.7,
    'https://images.unsplash.com/photo-1573812195421-50a396d17893?auto=format&fit=crop&q=80&w=800'
),
(
    'Executive Movement Notebook', 
    'movement-notebook', 
    'Stationery', 
    35.00, 
    75, 
    'Available', 
    'Hardcover A5 with gold foil branding and 120gsm paper.', 
    4.9,
    'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=800'
),
(
    'Movement Growth Hoodie', 
    'growth-hoodie', 
    'Apparel', 
    180.00, 
    0, 
    'Coming Soon', 
    'Oversized fit with screen-printed back graphics.', 
    5.0,
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800'
),
(
    'Founding Member Pin', 
    'member-pin', 
    'Limited Edition', 
    25.00, 
    200, 
    'Available', 
    'Enamel pin with polished gold finish and secure clasp.', 
    4.9,
    'https://images.unsplash.com/photo-1590400541360-b2034010a3b2?auto=format&fit=crop&q=80&w=800'
)
ON CONFLICT (slug) DO NOTHING;
