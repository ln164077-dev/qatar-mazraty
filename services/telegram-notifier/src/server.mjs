import http from "node:http";
import pg from "pg";

const { Pool } = pg;
const requiredEnv = ["DATABASE_URL", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];
for (const name of requiredEnv) {
  if (!process.env[name]) throw new Error(`${name} must be configured`);
}

const port = Number(process.env.PORT || 8787);
const pollIntervalMs = Math.max(3000, Number(process.env.POLL_INTERVAL_MS || 10000));
const telegramApi = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 30000 });
let polling = false;
let lastPollAt = null;
let lastError = null;

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function ensureNotificationTable() {
  await pool.query(`
    create table if not exists mawashi_telegram_notifications (
      order_id integer primary key references mawashi_orders(id) on delete cascade,
      telegram_message_id bigint,
      sent_at timestamptz not null default now()
    )
  `);
}

async function sendTelegramMessage(text) {
  const response = await fetch(`${telegramApi}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.description || `Telegram HTTP ${response.status}`);
  return body.result;
}

function orderMessage(order) {
  return [
    "<b>طلب جديد — مزرعتي قطر</b>",
    "",
    `<b>رقم الطلب:</b> #${escapeHtml(order.id)}`,
    `<b>المنتج:</b> ${escapeHtml(order.product_name)}`,
    `<b>الكمية:</b> ${escapeHtml(order.quantity)}`,
    `<b>العميل:</b> ${escapeHtml(order.customer_name)}`,
    `<b>رقم التواصل:</b> ${escapeHtml(order.phone)}`,
    `<b>العنوان:</b> ${escapeHtml(order.address)}`,
    `<b>موعد التوصيل:</b> ${escapeHtml(order.pickup_date)}`,
    `<b>طريقة الدفع:</b> ${escapeHtml(order.payment_method)}`,
    `<b>حالة الدفع:</b> ${escapeHtml(order.payment_status)}`,
    `<b>وقت الإنشاء:</b> ${escapeHtml(new Date(order.created_at).toLocaleString("ar-QA"))}`,
  ].join("\n");
}

async function pollOrders() {
  if (polling) return;
  polling = true;
  lastPollAt = new Date().toISOString();
  try {
    const { rows } = await pool.query(`
      select o.id, o.product_name, o.quantity, o.customer_name, o.phone, o.address,
        o.pickup_date, o.payment_method, o.payment_status, o.created_at
      from mawashi_orders o
      left join mawashi_telegram_notifications n on n.order_id = o.id
      where n.order_id is null
      order by o.created_at asc
      limit 20
    `);
    for (const order of rows) {
      const message = await sendTelegramMessage(orderMessage(order));
      await pool.query(`
        insert into mawashi_telegram_notifications (order_id, telegram_message_id)
        values ($1, $2)
        on conflict (order_id) do nothing
      `, [order.id, message.message_id ?? null]);
      console.log(`[telegram] sent order #${order.id}`);
    }
    lastError = null;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    console.error(`[telegram] poll failed: ${lastError}`);
  } finally {
    polling = false;
  }
}

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/healthz") {
    const healthy = !lastError;
    response.writeHead(healthy ? 200 : 503, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: healthy, service: "telegram-notifier", lastPollAt, error: lastError }));
    return;
  }
  response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "not_found" }));
});

await ensureNotificationTable();
await pollOrders();
setInterval(() => void pollOrders(), pollIntervalMs);
server.listen(port, "0.0.0.0", () => console.log(`[telegram] notifier listening on port ${port}; polling every ${pollIntervalMs}ms`));

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
