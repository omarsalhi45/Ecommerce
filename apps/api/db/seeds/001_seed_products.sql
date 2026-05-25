INSERT INTO products (id, name, description, price, image_url, category, popularity_score)
VALUES
  (
    'shirt-001',
    'Box Fit Street Tee',
    'Heavy cotton tee with a relaxed shape and clean OSAI mark.',
    29.99,
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    'tees',
    88
  ),
  (
    'jacket-001',
    'Night Run Windbreaker',
    'Lightweight shell with a crisp finish for city weather.',
    79.99,
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',
    'outerwear',
    72
  ),
  (
    'hoodie-001',
    'Everyday Weight Hoodie',
    'Soft fleece hoodie cut for layering without feeling bulky.',
    59.99,
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    'hoodies',
    95
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  category = EXCLUDED.category,
  popularity_score = EXCLUDED.popularity_score,
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

INSERT INTO product_reviews (id, product_id, author_name, rating, title, body, created_at)
VALUES
  (
    'review-shirt-001-1',
    'shirt-001',
    'Maya',
    5,
    'Perfect boxy shape',
    'The cotton feels heavy without being stiff, and the fit lands exactly right.',
    '2026-01-14T10:00:00.000Z'
  ),
  (
    'review-shirt-001-2',
    'shirt-001',
    'Noah',
    4,
    'Easy everyday tee',
    'Clean graphic, good collar, and it works under jackets.',
    '2026-01-22T14:30:00.000Z'
  ),
  (
    'review-jacket-001-1',
    'jacket-001',
    'Iris',
    4,
    'Light but useful',
    'Good for windy nights and packs down smaller than expected.',
    '2026-02-03T09:15:00.000Z'
  ),
  (
    'review-hoodie-001-1',
    'hoodie-001',
    'Leo',
    5,
    'Soft and structured',
    'Warm enough for late walks but still has a clean streetwear shape.',
    '2026-02-11T18:45:00.000Z'
  ),
  (
    'review-hoodie-001-2',
    'hoodie-001',
    'Ari',
    5,
    'Favorite hoodie this month',
    'The fleece is comfortable and the hood sits nicely without bunching.',
    '2026-02-18T12:20:00.000Z'
  )
ON CONFLICT (id) DO UPDATE SET
  author_name = EXCLUDED.author_name,
  rating = EXCLUDED.rating,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  created_at = EXCLUDED.created_at;
