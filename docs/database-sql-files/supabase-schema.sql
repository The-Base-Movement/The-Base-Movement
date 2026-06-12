-- THE BASE MOVEMENT - SUPABASE SCHEMA MIGRATION
-- Copy and paste this into your Supabase SQL Editor to initialize your database.

-- 1. Create Tables

-- Users Table (Profiles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    gender VARCHAR(50),
    region VARCHAR(100),
    constituency VARCHAR(100),
    chapter VARCHAR(100),
    profession VARCHAR(100),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status VARCHAR(50) DEFAULT 'Active',
    avatar_url TEXT
);

-- Blog Posts Table
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    author_id UUID REFERENCES users(id),
    category VARCHAR(100),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    read_time VARCHAR(50),
    seo_title VARCHAR(255),
    meta_description TEXT
);

-- Comments Table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Store Inventory
CREATE TABLE store_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    price_ghs DECIMAL NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Available',
    image_url TEXT,
    description TEXT,
    rating DECIMAL DEFAULT 5.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES store_inventory(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Chapters Table
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    city_or_region VARCHAR(255),
    country VARCHAR(100) DEFAULT 'Ghana',
    leader_name VARCHAR(255),
    member_count INTEGER DEFAULT 0,
    description TEXT,
    details_url TEXT,
    status VARCHAR(50) DEFAULT 'Active'
);

-- Polls Table
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    total_votes INTEGER DEFAULT 0,
    region VARCHAR(100) DEFAULT 'National',
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Poll Options
CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    votes INTEGER DEFAULT 0
);

-- Donation Campaigns
CREATE TABLE donation_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL NOT NULL,
    raised_amount DECIMAL DEFAULT 0,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'Active',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Donations Records
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES users(id),
    campaign_id UUID REFERENCES donation_campaigns(id),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    amount DECIMAL NOT NULL,
    country VARCHAR(100),
    payment_method VARCHAR(100),
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Verified, Rejected
    show_on_dashboard BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    admin_id UUID,
    metadata JSONB
);

-- Countries Reference
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    dialing_code VARCHAR(10),
    is_diaspora BOOLEAN DEFAULT true
);

-- Geographic Master Data
CREATE TABLE ghana_regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE ghana_constituencies (
    id SERIAL PRIMARY KEY,
    region_id INTEGER REFERENCES ghana_regions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    UNIQUE(region_id, name)
);

-- 2. Create Views for Analytics

-- Membership Growth View (Daily signups)
CREATE OR REPLACE VIEW membership_growth_view AS
SELECT 
    date_trunc('day', joined_at)::date as date,
    count(*)::integer as count
FROM users
GROUP BY 1
ORDER BY 1 ASC;

-- Regional Performance View
CREATE OR REPLACE VIEW regional_stats_view AS
SELECT 
    region,
    count(*)::integer as member_count,
    count(DISTINCT chapter)::integer as chapters_count
FROM users
GROUP BY region;

-- 3. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_registration_number ON users(registration_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_chapters_name ON chapters(name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- 4. Configure Row Level Security (RLS)

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghana_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghana_constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_inventory ENABLE ROW LEVEL SECURITY;

-- Allow Public READ access to directories
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to blog_posts" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "Allow public read access to chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Allow public read access to countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Allow public read access to ghana_regions" ON ghana_regions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to ghana_constituencies" ON ghana_constituencies FOR SELECT USING (true);
CREATE POLICY "Allow public read access to polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Allow public read access to poll_options" ON poll_options FOR SELECT USING (true);
CREATE POLICY "Allow public read access to store_inventory" ON store_inventory FOR SELECT USING (true);

-- Restrict WRITE access to authenticated users only (simplified for now)
CREATE POLICY "Allow authenticated insert to users" ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update to users" ON users FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Seed Basic Data

INSERT INTO ghana_regions (name) VALUES
('Ahafo'), ('Ashanti'), ('Bono'), ('Bono East'), ('Central'), ('Eastern'), ('Greater Accra'),
('North East'), ('Northern'), ('Oti'), ('Savannah'), ('Upper East'), ('Upper West'), ('Volta'), ('Western'), ('Western North')
ON CONFLICT DO NOTHING;

INSERT INTO countries (name, dialing_code, is_diaspora) VALUES
('Ghana', '+233', false),
('United Kingdom', '+44', true),
('United States', '+1', true),
('Canada', '+1', true),
('Germany', '+49', true),
('France', '+33', true),
('Australia', '+61', true),
('South Africa', '+27', true),
('United Arab Emirates', '+971', true),
('Netherlands', '+31', true),
('Italy', '+39', true)
ON CONFLICT DO NOTHING;
