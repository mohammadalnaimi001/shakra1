# Shakra Perfume

Production-ready luxury perfume eCommerce concept for **Shakra Perfume** at **shakraperfume.com**.

## Brand

- Brand: Shakra Perfume
- Identity: luxury niche fragrance house with dark, elegant, modern, mysterious styling
- Official contact: +(962)785828950
- Instagram: https://www.instagram.com/shakra_perfume?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==
- WhatsApp CTA: https://wa.me/962785828950

## Stack

- Vite, React 19, TypeScript
- React Router, Framer Motion, Lucide icons
- Express API with Helmet, CORS, Zod validation, JWT-ready auth
- PostgreSQL schema in `server/schema.sql`
- SEO metadata, sitemap, robots, favicon, Open Graph asset

## Features

- Home, shop, product details, collections, about, contact, cart, checkout, login/register, user dashboard, admin panel, FAQ, privacy, terms
- Product search, filtering, sorting, wishlist, cart, reviews, recommendations
- Dynamic logo system using `public/brand/shakra-logo-full.png`, `public/brand/shakra-logo-icon.png`, and `public/brand/favicon.png`
- Admin logo upload/reset controls that update navbar, mobile menu, footer, loading screen, checkout, favicon, and admin preview
- Checkout with Visa / credit card UI and Cash on Delivery
- Fixed 3 JOD delivery fee shown in order summary and included in dynamic total
- Arabic and English UI toggle
- JOD and USD currency toggle
- Exact Instagram URL linked in navbar, footer, and contact page
- WhatsApp contact CTA across the site
- Responsive dark-luxury UI with reduced-motion accessibility support
- Full admin dashboard at `/admin` with:
  - Product CRUD (images, price, stock, notes, categories, discounts, featured, publish state)
  - Order operations (status flow, search, filters, payment/customer visibility)
  - Customer operations (search, order count, ban/unban, delete)
  - Content management (hero/banner/testimonial/contact/social)
  - Branding management (logo URLs + global apply)
  - Translation management (EN/AR editable table)
  - Analytics cards and beginner-friendly sidebar workflow

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Run the API separately:

```bash
cp .env.example .env
npm run typecheck
npm run server
```

## Production Build

```bash
npm run build
npm run preview
```

## Vercel Deployment

The project includes `vercel.json` for Vite SPA deployment:

- Build command: `npm run build`
- Output directory: `dist`
- SPA refresh routing: all storefront routes rewrite to `index.html`
- Static asset caching: `/assets/*` and `/brand/*`

## Database Setup

Use PostgreSQL with the schema:

```bash
psql "$DATABASE_URL" -f server/schema.sql
```

Admin seed account is created automatically on server boot:

- `ADMIN_EMAIL` (default `admin@shakraperfume.com`)
- `ADMIN_PASSWORD` (default `ShakraAdmin@2026`)

Then sign in from `/admin`.

Recommended production services:

- PostgreSQL: Neon, Supabase, RDS, or Cloud SQL
- Card payments: Stripe, Checkout.com, HyperPay, or local acquiring bank gateway
- Email: Resend, Postmark, SendGrid, or AWS SES
- Hosting: Vercel, Netlify, Render, Fly.io, or AWS

## Environment

Copy `.env.example` to `.env` and replace the production secrets:

- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- SMTP values for transactional email
- `VITE_APP_DOMAIN`
- `VITE_API_URL`

## Security Notes

- API payloads are validated with Zod.
- Helmet is enabled for secure HTTP headers.
- Password hashing dependency is included for persistent auth integration.
- Store card details only through a certified payment provider tokenization flow.
- Keep admin endpoints behind JWT role checks before connecting to a real database.
