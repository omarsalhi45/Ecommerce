ALTER TABLE products
ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_compare_at_price_check'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_compare_at_price_check
    CHECK (compare_at_price IS NULL OR compare_at_price > price);
  END IF;
END $$;

UPDATE products
SET compare_at_price = 44.99, updated_at = NOW()
WHERE id = 'tee-002' AND price < 44.99;

UPDATE products
SET compare_at_price = 89.99, updated_at = NOW()
WHERE id = 'jacket-003' AND price < 89.99;

UPDATE products
SET compare_at_price = 94.99, updated_at = NOW()
WHERE id = 'hoodie-003' AND price < 94.99;

UPDATE products
SET compare_at_price = 84.99, updated_at = NOW()
WHERE id = 'pants-001' AND price < 84.99;

UPDATE products
SET compare_at_price = 29.99, updated_at = NOW()
WHERE id = 'beanie-001' AND price < 29.99;
