CREATE TABLE "cart_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cart_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"cart_id" varchar(24) NOT NULL,
	"event" text NOT NULL,
	"actor" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"serial" varchar(80) NOT NULL,
	"status" varchar(32) DEFAULT 'AVAILABLE' NOT NULL,
	"type" varchar(80) DEFAULT 'A-frame' NOT NULL,
	"condition" varchar(80) DEFAULT 'Good' NOT NULL,
	"location" text DEFAULT 'Shop bay 2' NOT NULL,
	"installer_id" integer,
	"checkout_date" timestamp with time zone,
	"days_out" integer,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installers" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"color" varchar(32),
	"role" varchar(80) DEFAULT 'Countertop Installer' NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_history" ADD CONSTRAINT "cart_history_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;