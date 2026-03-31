CREATE TYPE "public"."store_type" AS ENUM('clothing', 'minimart');--> statement-breakpoint
CREATE TABLE "stores" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "store_type" NOT NULL,
	"address" text,
	"tenant_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"permission_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"store_id" text NOT NULL,
	"role" text DEFAULT 'cashier' NOT NULL,
	"pin_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_wholesale_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"variant_id" text NOT NULL,
	"min_qty" integer NOT NULL,
	"price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_slug_unique";--> statement-breakpoint
ALTER TABLE "store_settings" DROP CONSTRAINT "store_settings_key_unique";--> statement-breakpoint
ALTER TABLE "stock_opnames" DROP CONSTRAINT "stock_opnames_code_unique";--> statement-breakpoint
ALTER TABLE "shifts" ALTER COLUMN "cashier_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_store_id" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "held_transactions" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "held_transactions" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reference_number" text;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_order_timeline" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "return_items" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "free_product_id" text;--> statement-breakpoint
ALTER TABLE "promotions" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_reconciliations" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "daily_reconciliations" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "employee_profile_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "store_settings" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_opname_items" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD COLUMN "store_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD COLUMN "employee_profile_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_permissions" ADD CONSTRAINT "employee_permissions_employee_id_employee_profiles_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_permissions" ADD CONSTRAINT "employee_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_wholesale_tiers" ADD CONSTRAINT "product_wholesale_tiers_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "held_transactions" ADD CONSTRAINT "held_transactions_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "held_transactions" ADD CONSTRAINT "held_transactions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_timeline" ADD CONSTRAINT "purchase_order_timeline_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reconciliations" ADD CONSTRAINT "daily_reconciliations_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reconciliations" ADD CONSTRAINT "daily_reconciliations_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opname_items" ADD CONSTRAINT "stock_opname_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_opnames" ADD CONSTRAINT "stock_opnames_employee_profile_id_employee_profiles_id_fk" FOREIGN KEY ("employee_profile_id") REFERENCES "public"."employee_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "store_key_idx" ON "store_settings" USING btree ("store_id","key");