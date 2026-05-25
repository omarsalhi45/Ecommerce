ALTER TABLE products
ADD COLUMN IF NOT EXISTS popularity_score INTEGER NOT NULL DEFAULT 0 CHECK (popularity_score >= 0);

CREATE INDEX IF NOT EXISTS idx_products_popularity_score ON products(popularity_score DESC);
