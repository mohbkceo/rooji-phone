export const schema = `
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL COLLATE NOCASE, password TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('customer','admin')), name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
 created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 digest TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS session_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS categories (
 id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, image TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL REFERENCES categories(id),
 brand TEXT NOT NULL, description TEXT NOT NULL, specs TEXT NOT NULL DEFAULT '', images TEXT NOT NULL DEFAULT '[]',
 status TEXT NOT NULL CHECK(status IN ('draft','published','archived')), featured INTEGER NOT NULL DEFAULT 0,
 seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT '', created TEXT NOT NULL, updated TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS public_catalog ON products(status,category,created DESC);
CREATE TABLE IF NOT EXISTS variants (
 id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id), label TEXT NOT NULL,
 price INTEGER NOT NULL CHECK(price > 0), sale INTEGER CHECK(sale > 0 AND sale < price),
 stock INTEGER NOT NULL CHECK(stock >= 0), image TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS product_variants ON variants(product_id,active,price);
CREATE TABLE IF NOT EXISTS requests (
 id TEXT PRIMARY KEY, ref TEXT UNIQUE NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('repair','product')),
 user_id TEXT REFERENCES users(id), name TEXT NOT NULL, phone TEXT NOT NULL, state TEXT NOT NULL,
 details TEXT NOT NULL, images TEXT NOT NULL, quote INTEGER CHECK(quote >= 0), quote_note TEXT NOT NULL DEFAULT '',
 decision TEXT NOT NULL DEFAULT '', diagnostic TEXT NOT NULL DEFAULT '', technician TEXT NOT NULL DEFAULT '',
 internal TEXT NOT NULL DEFAULT '', created TEXT NOT NULL, updated TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS request_kind_date ON requests(kind,created DESC);
CREATE INDEX IF NOT EXISTS request_customer ON requests(user_id);
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, ref TEXT UNIQUE NOT NULL, user_id TEXT REFERENCES users(id),
 request_id TEXT UNIQUE REFERENCES requests(id), name TEXT NOT NULL, phone TEXT NOT NULL,
 delivery TEXT NOT NULL, payment TEXT NOT NULL, wilaya TEXT NOT NULL, commune TEXT NOT NULL,
 address TEXT NOT NULL, note TEXT NOT NULL, state TEXT NOT NULL, subtotal INTEGER NOT NULL CHECK(subtotal >= 0),
 shipping INTEGER NOT NULL CHECK(shipping >= 0), total INTEGER NOT NULL CHECK(total = subtotal + shipping),
 internal TEXT NOT NULL DEFAULT '', idempotency TEXT UNIQUE, fingerprint TEXT, created TEXT NOT NULL, updated TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS order_date ON orders(created DESC);
CREATE INDEX IF NOT EXISTS order_customer ON orders(user_id);
CREATE TABLE IF NOT EXISTS order_items (
 order_id TEXT NOT NULL REFERENCES orders(id), variant_id TEXT REFERENCES variants(id),
 title TEXT NOT NULL, variant TEXT NOT NULL, price INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK(quantity > 0)
);
CREATE INDEX IF NOT EXISTS order_line ON order_items(order_id);
CREATE TABLE IF NOT EXISTS history (
 id INTEGER PRIMARY KEY, record_id TEXT NOT NULL, state TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS record_history ON history(record_id,id);
CREATE TABLE IF NOT EXISTS audit (
 id INTEGER PRIMARY KEY, actor TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL, record_id TEXT NOT NULL, created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, scope TEXT NOT NULL CHECK(scope IN ('public','private')), width INTEGER NOT NULL,height INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, until INTEGER NOT NULL);
INSERT OR IGNORE INTO categories(id,slug,name) VALUES
 ('smartphones','smartphones','Smartphones'),('accessoires','accessoires','Accessoires'),
 ('ecouteurs','ecouteurs','Écouteurs'),('montres','montres','Montres');
PRAGMA user_version = 1;
`;
