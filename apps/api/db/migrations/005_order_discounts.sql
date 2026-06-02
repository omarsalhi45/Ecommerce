ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_label TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) CHECK (
    discount_amount IS NULL OR discount_amount >= 0
  );
