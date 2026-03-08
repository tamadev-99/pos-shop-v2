CREATE TYPE "public"."opname_status" AS ENUM('draft', 'in_progress', 'pending_review', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "stock_opname_items" (
	"id" text PRIMARY KEY NOT NULL,
	"opname_id" text NOT NULL,
	"variant_id" text NOT NULL,
	"system_stock" integer NOT NULL,
	"actual_stock" integer,
	"difference" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_opnames" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"note" text,
	"status" "opname_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"created_by_name" text NOT NULL,
	"reviewed_by" text,
	"reviewed_by_name" text,
	"review_note" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_opnames_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_opname_id_stock_opnames_id_fk" FOREIGN KEY ("opname_id") REFERENCES "public"."stock_opnames"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;