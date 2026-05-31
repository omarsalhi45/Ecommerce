INSERT INTO products (id, name, description, price, image_url, category, popularity_score)
VALUES
  (
    'tee-002',
    'Washed Logo Tee',
    'Sun-faded cotton tee with a soft hand feel and small chest mark.',
    34.99,
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80',
    'tees',
    91
  ),
  (
    'tee-003',
    'Cropped Rib Tank',
    'Clean ribbed tank built for warm days, gym layers, and open shirts.',
    24.99,
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80',
    'tees',
    76
  ),
  (
    'tee-004',
    'Long Sleeve Skater Tee',
    'Midweight long sleeve with dropped shoulders and sleeve hit graphics.',
    42.99,
    'https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=900&q=80',
    'tees',
    84
  ),
  (
    'jacket-002',
    'Canvas Coach Jacket',
    'Structured cotton canvas jacket with snap front and roomy pockets.',
    89.99,
    'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80',
    'outerwear',
    83
  ),
  (
    'jacket-003',
    'Puffer Vest Layer',
    'Light insulated vest for hoodies, cold mornings, and late train rides.',
    69.99,
    'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=900&q=80',
    'outerwear',
    78
  ),
  (
    'jacket-004',
    'Cropped Denim Jacket',
    'Boxy denim jacket with a washed finish and sharp cropped proportion.',
    94.99,
    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=80',
    'outerwear',
    86
  ),
  (
    'hoodie-002',
    'Zip Layer Hoodie',
    'Full-zip fleece hoodie with a slightly cropped body and double zipper.',
    64.99,
    'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=900&q=80',
    'hoodies',
    90
  ),
  (
    'hoodie-003',
    'Oversized Graphic Hoodie',
    'Heavy fleece hoodie with a large back graphic and stacked cuffs.',
    74.99,
    'https://images.unsplash.com/photo-1565693413579-8ff3fdc1b03b?auto=format&fit=crop&w=900&q=80',
    'hoodies',
    97
  ),
  (
    'sweatshirt-001',
    'Quarter Zip Sweatshirt',
    'Soft collar sweatshirt for clean layering over tees or tanks.',
    54.99,
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',
    'hoodies',
    81
  ),
  (
    'pants-001',
    'Wide Cargo Trouser',
    'Wide-leg cargo pant with adjustable hems and deep side pockets.',
    69.99,
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
    'bottoms',
    94
  ),
  (
    'pants-002',
    'Relaxed Utility Jean',
    'Relaxed denim with workwear pocketing and a broken-in wash.',
    74.99,
    'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',
    'bottoms',
    87
  ),
  (
    'shorts-001',
    'Nylon Trail Short',
    'Light nylon shorts with mesh pockets and an easy elastic waist.',
    44.99,
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=900&q=80',
    'bottoms',
    75
  ),
  (
    'skirt-001',
    'Pleated Court Skirt',
    'Crisp pleated skirt with hidden shorts and a street-sport shape.',
    49.99,
    'https://images.unsplash.com/photo-1583496661160-fb5886a13d27?auto=format&fit=crop&w=900&q=80',
    'bottoms',
    82
  ),
  (
    'cap-001',
    'Low Profile Cap',
    'Curved-brim cap with tonal embroidery and an adjustable back strap.',
    24.99,
    'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80',
    'accessories',
    79
  ),
  (
    'bag-001',
    'City Sling Bag',
    'Compact crossbody sling with enough space for phone, keys, and wallet.',
    39.99,
    'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80',
    'accessories',
    89
  ),
  (
    'beanie-001',
    'Rib Knit Beanie',
    'Soft ribbed beanie with a shallow fold and subtle woven label.',
    19.99,
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    'accessories',
    73
  ),
  (
    'socks-001',
    'Heavy Crew Sock Pack',
    'Three-pack of cushioned crew socks with ribbed cuffs and logo knit.',
    18.99,
    'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=900&q=80',
    'accessories',
    70
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
  ('tee-002', 'OSAI-WASH-NAT-M', 'M', 'Natural', 18, 6),
  ('tee-003', 'OSAI-TANK-WHT-S', 'S', 'White', 15, 6),
  ('tee-004', 'OSAI-LS-BLU-L', 'L', 'Blue', 11, 5),
  ('jacket-002', 'OSAI-COACH-KHK-M', 'M', 'Khaki', 9, 4),
  ('jacket-003', 'OSAI-VEST-GRN-L', 'L', 'Green', 5, 5),
  ('jacket-004', 'OSAI-DENIM-BLU-M', 'M', 'Blue', 13, 5),
  ('hoodie-002', 'OSAI-ZIP-BLK-S', 'S', 'Black', 12, 5),
  ('hoodie-003', 'OSAI-GRAPH-RED-L', 'L', 'Red', 4, 5),
  ('sweatshirt-001', 'OSAI-QZIP-CRM-M', 'M', 'Cream', 16, 6),
  ('pants-001', 'OSAI-CARGO-BLK-M', 'M', 'Black', 7, 5),
  ('pants-002', 'OSAI-JEAN-BLU-32', '32', 'Blue', 14, 5),
  ('shorts-001', 'OSAI-SHORT-GRN-M', 'M', 'Green', 20, 6),
  ('skirt-001', 'OSAI-SKIRT-BLK-S', 'S', 'Black', 6, 4),
  ('cap-001', 'OSAI-CAP-BLK-OS', 'OS', 'Black', 32, 8),
  ('bag-001', 'OSAI-SLING-GRY-OS', 'OS', 'Grey', 10, 4),
  ('beanie-001', 'OSAI-BEANIE-GRN-OS', 'OS', 'Green', 3, 5),
  ('socks-001', 'OSAI-SOCK-WHT-OS', 'OS', 'White', 40, 10)
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
    'review-tee-002-1',
    'tee-002',
    'Jules',
    5,
    'Vintage feel right away',
    'The wash looks already broken in, but the collar still feels sturdy.',
    '2026-03-01T11:00:00.000Z'
  ),
  (
    'review-hoodie-003-1',
    'hoodie-003',
    'Nina',
    5,
    'Big hoodie energy',
    'Oversized without swallowing the whole outfit. The back graphic gets noticed.',
    '2026-03-04T16:30:00.000Z'
  ),
  (
    'review-pants-001-1',
    'pants-001',
    'Kai',
    5,
    'Pocket layout is perfect',
    'The shape sits wide but clean, and the cargo pockets do not balloon out.',
    '2026-03-08T13:20:00.000Z'
  ),
  (
    'review-bag-001-1',
    'bag-001',
    'Sami',
    4,
    'Good city size',
    'Fits daily stuff without feeling like a full backpack. Strap is comfortable.',
    '2026-03-11T09:45:00.000Z'
  ),
  (
    'review-beanie-001-1',
    'beanie-001',
    'Mina',
    5,
    'Soft and not itchy',
    'The fold sits low and the knit feels warmer than expected.',
    '2026-03-14T19:10:00.000Z'
  )
ON CONFLICT (id) DO UPDATE SET
  author_name = EXCLUDED.author_name,
  rating = EXCLUDED.rating,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  created_at = EXCLUDED.created_at;
