import pg from "pg";
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const result = await client.query(`
    insert into mawashi_products (name, description, image_url, max_quantity, price, active)
    select $1, $2, $3, $4, $5, true
    where not exists (select 1 from mawashi_products)
    returning id
  `, ["دجاج طازج قطري", "منتج تجريبي لتجربة الحجز والتوصيل داخل قطر.", "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=900&q=80", 10, "25.000"]);
  console.log(JSON.stringify({ seeded: result.rows.length > 0, productId: result.rows[0]?.id ?? null }));
} finally {
  await client.end();
}
