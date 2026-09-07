import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query(`
    create table if not exists mawashi_products (
      id serial primary key,
      name text not null,
      description text not null,
      image_url text not null,
      max_quantity integer not null default 10,
      price numeric(10, 3) not null default 0,
      active boolean not null default true,
      created_at timestamptz not null default now()
    );

    create table if not exists mawashi_site_content (
      id serial primary key,
      brand_name text not null,
      hero_title text not null,
      hero_text text not null,
      hero_image_url text not null,
      nav_links text[] not null default '{}',
      updated_at timestamptz not null default now()
    );

    create table if not exists mawashi_orders (
      id serial primary key,
      product_id integer not null,
      product_name text not null,
      quantity integer not null,
      customer_name text not null,
      phone text not null,
      address text not null,
      pickup_date date not null,
      payment_method text not null,
      payment_status text not null default 'not_required',
      status text not null default 'new',
      created_at timestamptz not null default now()
    );

    create table if not exists mawashi_presence (
      session_id text primary key,
      page text not null,
      label text not null,
      customer_name text,
      last_seen_at timestamptz not null default now()
    );

    create table if not exists mawashi_telegram_notifications (
      order_id integer primary key references mawashi_orders(id) on delete cascade,
      telegram_message_id bigint,
      sent_at timestamptz not null default now()
    );
  `);
  const result = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_name in (
      'mawashi_products', 'mawashi_site_content', 'mawashi_orders',
      'mawashi_presence', 'mawashi_telegram_notifications'
    ) order by table_name
  `);
  console.log(JSON.stringify({ createdOrPresent: result.rows.map((row) => row.table_name) }, null, 2));
} finally {
  await client.end();
}
