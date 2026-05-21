import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { z } from "zod";
import { BRAND, products, reviews } from "../src/data";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 8787);
const jwtSecret = process.env.JWT_SECRET ?? "development-only-secret";

app.use(helmet());
app.use(cors({ origin: process.env.VITE_APP_DOMAIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "128kb" }));

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    phone: z.string().regex(/^(\+?962|0)?7[789][0-9]{7}$/),
    address: z.string().min(10)
  }),
  paymentMethod: z.enum(["card", "cod"]),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1)
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, brand: BRAND.name, domain: BRAND.domain });
});

app.get("/api/products", (_req, res) => {
  res.json({ products });
});

app.get("/api/products/:slug", (req, res) => {
  const product = products.find((entry) => entry.slug === req.params.slug);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product, reviews: reviews.filter((review) => review.productId === product.id) });
});

app.post("/api/auth/login", (req, res) => {
  const parsed = z.object({ email: z.string().email(), name: z.string().min(2).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid login payload" });
  const token = jwt.sign({ email: parsed.data.email, role: "client" }, jwtSecret, { expiresIn: "7d" });
  res.json({ token, user: { email: parsed.data.email, name: parsed.data.name ?? "Shakra Client", tier: "Private Client" } });
});

app.post("/api/checkout", (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid checkout payload", issues: parsed.error.issues });

  const subtotalJod = parsed.data.items.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return sum + (product?.priceJod ?? 0) * item.quantity;
  }, 0);

  const order = {
    id: `SP-${nanoid(8).toUpperCase()}`,
    status: parsed.data.paymentMethod === "cod" ? "Preparing" : "Payment authorized",
    subtotalJod,
    deliveryJod: BRAND.deliveryFeeJod,
    totalJod: subtotalJod + BRAND.deliveryFeeJod,
    customer: parsed.data.customer,
    paymentMethod: parsed.data.paymentMethod
  };

  res.status(201).json({
    order,
    next: parsed.data.paymentMethod === "card" ? "Send order total to Stripe or local acquiring bank gateway." : "Confirm COD order with WhatsApp concierge."
  });
});

app.post("/api/newsletter", (req, res) => {
  const parsed = z.object({ email: z.string().email(), language: z.enum(["en", "ar"]).default("en") }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid email" });
  res.status(201).json({ ok: true, message: "Subscribed to Shakra Perfume private notes." });
});

app.get("/api/admin/analytics", (_req, res) => {
  res.json({
    revenueJod: 28420,
    conversionRate: 4.8,
    averageOrderValueJod: 142,
    lowStock: products.filter((product) => product.inventory < 25)
  });
});

app.listen(port, () => {
  console.log(`Shakra Perfume API running on http://localhost:${port}`);
});
