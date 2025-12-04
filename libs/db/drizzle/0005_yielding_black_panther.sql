DROP INDEX "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "sub_agency_id" text;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "role" "role" DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "created_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD CONSTRAINT "verification_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification" DROP COLUMN "identifier";--> statement-breakpoint
ALTER TABLE "verification" DROP COLUMN "value";