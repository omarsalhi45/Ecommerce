INSERT INTO products (id, name, description, price, image_url, category)
VALUES
  (
    'shirt-001',
    'Box Fit Street Tee',
    'Heavy cotton tee with a relaxed shape and clean OSAI mark.',
    29.99,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    'tees'
  ),
  (
    'jacket-001',
    'Night Run Windbreaker',
    'Lightweight shell with a crisp finish for city weather.',
    79.99,
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',
    'outerwear'
  ),
  (
    'hoodie-001',
    'Everyday Weight Hoodie',
    'Soft fleece hoodie cut for layering without feeling bulky.',
    59.99,
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    'hoodies'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  updated_at = NOW();

INSERT INTO inventory (product_id, sku, size, color, stock_quantity, low_stock_threshold)
VALUES
  ('shirt-001', 'OSAI-TEE-BLK-M', 'M', 'Black', 48, 8),
  ('jacket-001', 'OSAI-WIND-BLK-L', 'L', 'Black', 21, 5),
  ('hoodie-001', 'OSAI-HOOD-GRY-M', 'M', 'Grey', 34, 6)
ON CONFLICT (product_id) DO UPDATE SET
  sku = EXCLUDED.sku,
  size = EXCLUDED.size,
  color = EXCLUDED.color,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  updated_at = NOW();
