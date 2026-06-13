ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_pkey;

ALTER TABLE inventory
  ADD CONSTRAINT inventory_pkey PRIMARY KEY (sku);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
