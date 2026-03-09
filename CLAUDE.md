# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KasirPro — a full-featured Point of Sale (POS) and inventory management system. Indonesian-language UI targeting retail businesses. PWA-enabled with thermal printer and barcode scanner support.

## Commands

- `npm run dev` — Start dev server (Next.js with Turbopack)
- `npm run build` — Production build
- `npm run lint` — ESLint (flat config, Next.js core-web-vitals + typescript)
- `npm run db:generate` — Generate Drizzle migrations
- `npm run db:push` — Push schema changes to database
- `npm run db:seed` — Seed database (`tsx src/db/seed.ts`)
- `npm run db:studio` — Open Drizzle Studio

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **Drizzle ORM** with PostgreSQL (`postgres` driver, `prepare: false`)
- **Better Auth** for authentication (email/password, session cookies)
- **Zod** for validation, **Sonner** for toasts, **Recharts** for charts
- **Lucide React** for icons

## Architecture

### Database Layer (`src/db/`)
- `src/db/index.ts` — Single `db` export using `drizzle(client, { schema })`
- `src/db/schema/` — Schema modules (auth, products, customers, suppliers, orders, purchases, returns, promotions, finance, notifications, audit, settings), all re-exported from `index.ts`
- Drizzle config reads `DATABASE_URL` from `.env.local`
- Migrations output to `./drizzle/`

### Server Actions (`src/lib/actions/`)
All data mutations/queries use Next.js Server Actions (`"use server"`). Each domain has its own file (orders, products, customers, shifts, etc.). Actions use `revalidatePath` for cache invalidation.

### Auth & RBAC
- **Server**: `src/lib/auth.ts` — Better Auth config with Drizzle adapter. Sessions expire in 7 days.
- **Client**: `src/lib/auth-client.ts` — `createAuthClient` with `useSession`, `signIn`, `signOut`
- **Auth helpers**: `src/lib/actions/auth-helpers.ts` — `getCurrentUser()`, `requireAuth()`, `requireRole()` for server actions
- **RBAC**: `src/lib/rbac.ts` — Three roles: `cashier`, `manager`, `owner`. Route-based permissions.
- **Auth provider**: `src/components/providers/auth-provider.tsx` wraps dashboard layout
- Auth API route: `src/app/api/auth/[...all]/route.ts`

### Route Structure (`src/app/`)
- `(dashboard)/` — Main layout group with sidebar. Uses `force-dynamic`. Key pages:
  - `pos/` — Cashier interface (product grid, cart, payment, receipt)
  - `pesanan/` — Orders + returns tabs
  - `produk/` — Products, categories, stock tabs
  - `pembelian/` — Purchases + suppliers tabs
  - `kontak/` — Customers + employees tabs
  - `laporan/` — Reports (financial, cashflow, tax, payables)
  - `pengaturan/` — Settings (account, audit log, barcode) — owner only
  - `shift/`, `promosi/`, `notifikasi/`
- `login/` — Login page
- `receipt/[id]/` — Public receipt view (for WhatsApp sharing)
- Each page follows a pattern: `page.tsx` (server component) + `*-client.tsx` (client component)

### UI Components
- `src/components/ui/` — Shared primitives (button, card, dialog, input, select, tabs, badge, pagination, confirm-dialog, toast-provider)
- `src/components/pos/` — POS-specific components (cart-panel, product-grid, payment-dialog, receipt-dialog, barcode-scanner, variant-selector)
- `src/components/dashboard/` — Dashboard chart/stat widgets
- `src/components/sidebar.tsx` — Main navigation sidebar
- Utility: `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge)

### Conventions
- Currency formatting: `formatRupiah()` from `src/lib/utils.ts` (IDR, no decimals)
- UI language is Indonesian (e.g., "Tunai" for cash, "Pesanan" for orders)
- Path alias: `@/` maps to `src/`
- Middleware file — using the new method nextjs the name file is `proxy.ts`
- Dark theme by default (`<html class="dark">`)
