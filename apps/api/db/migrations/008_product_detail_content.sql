ALTER TABLE products
  ADD COLUMN IF NOT EXISTS model_height TEXT,
  ADD COLUMN IF NOT EXISTS model_size TEXT,
    ADD COLUMN IF NOT EXISTS fit_description TEXT,
    ADD COLUMN IF NOT EXISTS material_description TEXT,
    ADD COLUMN IF NOT EXISTS care_instructions TEXT,
    ADD COLUMN IF NOT EXISTS product_story TEXT,
    ADD COLUMN IF NOT EXISTS product_questions JSONB;
