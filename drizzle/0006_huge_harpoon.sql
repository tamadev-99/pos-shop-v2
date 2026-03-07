CREATE TYPE "public"."po_payment_status" AS ENUM('belum_bayar', 'sebagian', 'lunas');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned_reason" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "due_date" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "paid_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "payment_status" "po_payment_status" DEFAULT 'belum_bayar' NOT NULL;