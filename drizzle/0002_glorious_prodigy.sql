CREATE TYPE "public"."recurring_frequency" AS ENUM('harian', 'mingguan', 'bulanan', 'tahunan');--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "transaction_type" DEFAULT 'keluar' NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"amount" integer NOT NULL,
	"frequency" "recurring_frequency" NOT NULL,
	"next_due_date" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "total_cash_sales" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "total_non_cash_sales" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;