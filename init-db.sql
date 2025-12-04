-- Tables TechShop
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total_amount DECIMAL(10, 2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  price DECIMAL(10, 2)
);

-- Données de test
INSERT INTO products (name, price, stock) VALUES
  ('Laptop Dell XPS 15', 1299.99, 10),
  ('iPhone 14 Pro', 1159.99, 25),
  ('Samsung Monitor 27"', 299.99, 15),
  ('Logitech MX Master 3', 99.99, 50),
  ('MacBook Air M2', 1399.99, 8),
  ('AirPods Pro', 279.99, 30),
  ('Sony WH-1000XM5', 399.99, 20),
  ('iPad Pro 11"', 899.99, 12),
  ('Mechanical Keyboard', 149.99, 40),
  ('Webcam 4K', 129.99, 18);

INSERT INTO users (email, name) VALUES
  ('john.doe@example.com', 'John Doe'),
  ('jane.smith@example.com', 'Jane Smith'),
  ('bob.wilson@example.com', 'Bob Wilson');