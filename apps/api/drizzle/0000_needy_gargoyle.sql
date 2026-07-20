CREATE TABLE "adherence_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"status" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"google_event_id" text,
	"title" text NOT NULL,
	"type" text DEFAULT 'office_visit' NOT NULL,
	"provider_id" uuid,
	"location" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"prep_notes" text,
	"visit_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"organization" text,
	"phone" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"diagnosed_at" date,
	"status" text DEFAULT 'active' NOT NULL,
	"managing_provider_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"model" text,
	"tool_calls" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_accounts" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token_encrypted" text,
	"expires_at" timestamp with time zone NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"rxcui" text,
	"dose" text NOT NULL,
	"form" text DEFAULT 'tablet' NOT NULL,
	"schedule" jsonb NOT NULL,
	"purpose" text,
	"prescriber" text,
	"pharmacy" text,
	"started_at" date,
	"ended_at" date,
	"refills_remaining" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"value_secondary" numeric(10, 2),
	"unit" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"context" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"date_of_birth" date,
	"sex_at_birth" text,
	"height_cm" numeric(5, 1),
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"allergies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"preferred_pharmacy" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"questionnaire_key" text NOT NULL,
	"answers" jsonb NOT NULL,
	"score" integer,
	"band" text,
	"critical_triggered" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"onboarded_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "adherence_events" ADD CONSTRAINT "adherence_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adherence_events" ADD CONSTRAINT "adherence_events_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_care_team_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."care_team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_team" ADD CONSTRAINT "care_team_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_managing_provider_id_care_team_id_fk" FOREIGN KEY ("managing_provider_id") REFERENCES "public"."care_team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_accounts" ADD CONSTRAINT "google_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medications" ADD CONSTRAINT "medications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "adherence_user_time_idx" ON "adherence_events" USING btree ("user_id","scheduled_for");--> statement-breakpoint
CREATE UNIQUE INDEX "adherence_med_slot_idx" ON "adherence_events" USING btree ("medication_id","scheduled_for");--> statement-breakpoint
CREATE INDEX "appointments_user_time_idx" ON "appointments" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE INDEX "care_team_user_idx" ON "care_team" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conditions_user_key_idx" ON "conditions" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "conversations_user_time_idx" ON "conversations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "medications_user_active_idx" ON "medications" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "metrics_user_type_time_idx" ON "metrics" USING btree ("user_id","type","recorded_at");--> statement-breakpoint
CREATE INDEX "metrics_user_time_idx" ON "metrics" USING btree ("user_id","recorded_at");--> statement-breakpoint
CREATE INDEX "questionnaire_user_key_time_idx" ON "questionnaire_responses" USING btree ("user_id","questionnaire_key","completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");