CREATE TABLE "imaging_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"modality" text DEFAULT 'other' NOT NULL,
	"title" text NOT NULL,
	"exam_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"facility" text,
	"referring_physician" text,
	"reading_physician" text,
	"indication" text,
	"comparison_note" text,
	"diagnoses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"measurements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"conclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_document" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "imaging_reports" ADD CONSTRAINT "imaging_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "imaging_reports_user_time_idx" ON "imaging_reports" USING btree ("user_id","exam_at");
