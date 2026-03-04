CREATE TYPE "public"."reconciliation_status" AS ENUM('draft', 'completed');--> statement-breakpoint
CREATE TABLE "daily_reconciliations" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"calculated_income" integer NOT NULL,
	"calculated_expense" integer NOT NULL,
	"actual_cash_in_hand" integer NOT NULL,
	"difference" integer NOT NULL,
	"notes" text,
	"status" "reconciliation_status" DEFAULT 'draft' NOT NULL,
	"reconciled_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_reconciliations" ADD CONSTRAINT "daily_reconciliations_reconciled_by_users_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;