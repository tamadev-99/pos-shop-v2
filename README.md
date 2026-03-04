# KasirPro (POS v2)

KasirPro is a modern, full-featured Point of Sale (POS) and inventory management system built with Next.js 16, React 19, Tailwind CSS v4, and Drizzle ORM. Designed for businesses to efficiently manage sales, inventory, employees, and customer relationships.

## 🚀 Features

### Core POS
- **Cashier Interface**: Fast, keyboard/barcode scanner optimized checkout flow.
- **Multiple Payment Methods**: Cash (Tunai), E-Wallet, QRIS, Debit, Credit, and Bank Transfer.
- **Held Transactions**: Temporarily hold customer orders (Save/Restore carts).
- **Shift Management**: Track opening/closing balances and calculate expected versus actual cash drawers per cashier shift.

### Receipt & Printing
- **Thermal Printer Support**: Print receipts directly to USB/Bluetooth thermal printers using Web Bluetooth API.
- **WhatsApp Digital Receipts**: Instantly send beautifully formatted digital receipts to customers via WhatsApp.

### Inventory & Products
- **Product Management**: Support for product variants (Color, Size), categories, and brands.
- **Stock Tracking**: Real-time stock decrements and low-stock alerts.
- **Suppliers & Purchasing**: Manage supplier data, track purchase history, and handle incoming stock.
- **Returns (Retur)**: Process customer returns smoothly.
- **Barcode Scanning**: Built-in support for scanning items via webcam or external barcode scanners using `html5-qrcode`.

### Customers & CRM
- **Customer Database**: Maintain customer profiles and purchase history.
- **Loyalty Points**: Customers earn points from transactions that can be redeemed for discounts later.

### Backoffice & Reporting
- **Employee Management**: Role-based access control (Admin, Cashier, Manager).
- **Dashboard & Analytics**: Real-time sales charts, revenue metrics, and top-selling products using `recharts`.
- **Audit Logs**: System-wide logging of sensitive actions for security and accountability.

## 💻 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Engine**: PostgreSQL
- **Authentication**: [Better Auth](https://better-auth.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Validation**: [Zod](https://zod.dev/)

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL database

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="postgres://username:password@host:port/database"
   BETTER_AUTH_SECRET="your-secret-key"
   ```

3. Setup the database schema:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. (Optional) Seed the database with initial mock data:
   ```bash
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Available Scripts

- `npm run dev` - Starts the Next.js development server.
- `npm run build` - Builds the application for production.
- `npm run start` - Starts the production server.
- `npm run db:generate` - Generates Drizzle migrations.
- `npm run db:push` - Pushes schema changes directly to the database.
- `npm run db:studio` - Opens Drizzle Studio to inspect database tables and records visually.
- `npm run db:seed` - Seeds the database with default data.

## 📄 License
Private and Confidential.
