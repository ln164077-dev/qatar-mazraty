import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { CreateOrderBody } from "@workspace/api-zod";
import { db, productsTable, siteContentTable, ordersTable, presenceTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/products", async (_req, res, next) => {
  try {
    const rows = await db.select().from(productsTable).where(eq(productsTable.active, true)).orderBy(desc(productsTable.createdAt));
    res.json(rows);
  } catch (error) { next(error); return; }
});

router.get("/storefront", async (_req, res, next) => {
  try {
    const [content] = await db.select().from(siteContentTable).orderBy(desc(siteContentTable.updatedAt)).limit(1);
    const products = await db.select().from(productsTable).where(eq(productsTable.active, true)).orderBy(desc(productsTable.createdAt));
    res.json({ content: content ?? null, products });
  } catch (error) { next(error); return; }
});

router.post("/orders", async (req, res, next) => {
  try {
    const input = CreateOrderBody.parse(req.body);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, input.productId)).limit(1);
    if (!product || !product.active) { res.status(400).json({ message: "المنتج غير متاح حالياً" }); return; }
    if (input.quantity > product.maxQuantity) { res.status(400).json({ message: "الكمية المطلوبة تتجاوز المتاح" }); return; }
    const [created] = await db.insert(ordersTable).values({ ...input, productName: product.name, pickupDate: input.pickupDate.toISOString().slice(0, 10) }).returning();
    res.status(201).json(created);
  } catch (error) { next(error); return; }
});

router.put("/presence", async (req, res, next) => {
  try {
    const input = req.body;
    if (!input?.sessionId || !input?.page || !input?.label) { res.status(400).json({ message: "بيانات الحضور غير مكتملة" }); return; }
    const [row] = await db.insert(presenceTable).values({ sessionId: String(input.sessionId), page: String(input.page), label: String(input.label), customerName: input.customerName ? String(input.customerName) : null, lastSeenAt: new Date() }).onConflictDoUpdate({ target: presenceTable.sessionId, set: { page: String(input.page), label: String(input.label), customerName: input.customerName ? String(input.customerName) : null, lastSeenAt: new Date() } }).returning();
    res.json(row);
  } catch (error) { next(error); return; }
});

export default router;
