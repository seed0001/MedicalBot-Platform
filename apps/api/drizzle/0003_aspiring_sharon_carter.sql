CREATE TABLE "lab_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"test_name" text NOT NULL,
	"loinc" text,
	"value" text NOT NULL,
	"unit" text,
	"collected_at" timestamp with time zone,
	"reference_low" numeric(12, 3),
	"reference_high" numeric(12, 3),
	"reference_text" text,
	"flag" text DEFAULT 'normal' NOT NULL,
	"ordering_provider" text,
	"performing_lab" text,
	"panel_name" text,
	"note" text,
	"source_document" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lab_results_user_time_idx" ON "lab_results" USING btree ("user_id","collected_at");