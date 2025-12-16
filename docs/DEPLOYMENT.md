# KOFA Commerce Engine - Deployment Guide

## Step 1: Set Up Supabase (Free Tier)

### Create Supabase Account
1. Go to **https://supabase.com** and click "Start your project"
2. Sign up with GitHub or email (free)
3. Create a new project:
   - Name: `kofa`
   - Database Password: (save this somewhere safe!)
   - Region: Choose closest to Nigeria (e.g., London or Frankfurt)
4. Wait ~2 minutes for project to initialize

### Get Your Credentials
After project is ready:
1. Go to **Settings > API** in left sidebar
2. Copy these values:
   - **Project URL** → Will be `SUPABASE_URL`
   - **anon public** key → Will be `SUPABASE_KEY`

### Create Database Tables
1. Go to **SQL Editor** in left sidebar
2. Click "New Query"
3. Paste and run this SQL:

```sql
-- Products table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price_ngn DECIMAL(10, 2) NOT NULL,
    stock_level INTEGER DEFAULT 0,
    description TEXT,
    voice_tags TEXT[],
    category VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_phone VARCHAR(20) NOT NULL,
    items JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount_ngn DECIMAL(10, 2),
    payment_ref VARCHAR(100),
    delivery_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    amount_ngn DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_business BOOLEAN DEFAULT TRUE,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for demo (tighten in production)
CREATE POLICY "Allow all" ON products FOR ALL USING (true);
CREATE POLICY "Allow all" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true);

-- Insert sample products
INSERT INTO products (name, price_ngn, stock_level, description, voice_tags, category) VALUES
('Premium Red Sneakers', 45000, 12, 'Fresh kicks for the street', ARRAY['sneakers', 'red shoe', 'kicks'], 'footwear'),
('Lagos Beach Shorts', 8500, 25, 'Perfect for that Elegushi flex', ARRAY['shorts', 'beach wear', 'summer'], 'clothing'),
('Ankara Print Shirt', 15000, 8, 'Traditional meets modern', ARRAY['ankara', 'shirt', 'native'], 'clothing'),
('Designer Sunglasses', 22000, 15, 'Block out Lagos sun in style', ARRAY['shades', 'glasses', 'sunglasses'], 'accessories'),
('Gold Chain Necklace', 85000, 5, 'Shine like Burna Boy', ARRAY['chain', 'jewelry', 'gold'], 'jewelry'),
('Leather Wallet', 12000, 20, 'Keep your Naira secure', ARRAY['wallet', 'leather', 'purse'], 'accessories');
```

---

## Step 2: Deploy to Render (Free Tier)

### Create Render Account
1. Go to **https://render.com** and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected

### Deploy the Backend
1. Select your KOFA repository (or "Public Git Repository")
2. Enter repo URL if needed: `https://github.com/YOUR_USERNAME/kofa`
3. Configure:
   - **Name**: `kofa-api`
   - **Region**: Frankfurt (closest to Africa)
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Plan**: `Free`

4. Add Environment Variables (click "Advanced"):
   - `SUPABASE_URL` = (paste your Supabase Project URL)
   - `SUPABASE_KEY` = (paste your Supabase anon key)
   - `NAIRA_RAMP_BASE_URL` = `https://api.nairaramp.com`

5. Click "Create Web Service"
6. Wait ~5-10 minutes for first deployment

### Deploy Landing Page (Optional)
1. Click "New +" → "Static Site"
2. Select your repository
3. Configure:
   - **Name**: `kofa-landing`
   - **Publish Directory**: `./landing`
4. Deploy

---

## Step 3: Verify Deployment

After deployment completes:

1. **Test Health Endpoint**:
   Visit: `https://kofa-api.onrender.com/health`
   Should return: `{"status": "healthy"}`

2. **View API Docs**:
   Visit: `https://kofa-api.onrender.com/docs`
   Full Swagger documentation

3. **Update Mobile App**:
   Edit `mobile/lib/api.ts`:
   ```typescript
   const API_BASE_URL = 'https://kofa-api.onrender.com';
   ```

---

## Notes

> ⚠️ **Free Tier Limitations**:
> - Render free tier "spins down" after 15 min of inactivity
> - First request after spindown takes ~30 seconds
> - For production, upgrade to paid tier ($7/month)

> 💡 **Without Supabase**:
> The app works with mock data if Supabase isn't configured.
> You can deploy first, then add Supabase credentials later.
