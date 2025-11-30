CREATE TYPE "public"."role" AS ENUM('admin', 'member', 'viewer');--> statement-breakpoint
CREATE TABLE "agency_user" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sub_agency_id" text NOT NULL,
	"role" "role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_agency" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_agency_id" text,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agency_user" ADD CONSTRAINT "agency_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_user" ADD CONSTRAINT "agency_user_sub_agency_id_sub_agency_id_fk" FOREIGN KEY ("sub_agency_id") REFERENCES "public"."sub_agency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_agency" ADD CONSTRAINT "sub_agency_parent_agency_id_sub_agency_id_fk" FOREIGN KEY ("parent_agency_id") REFERENCES "public"."sub_agency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_agency" ADD CONSTRAINT "sub_agency_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agency_user_userId_idx" ON "agency_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agency_user_subAgencyId_idx" ON "agency_user" USING btree ("sub_agency_id");--> statement-breakpoint
CREATE INDEX "sub_agency_ownerId_idx" ON "sub_agency" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "sub_agency_parentAgencyId_idx" ON "sub_agency" USING btree ("parent_agency_id");