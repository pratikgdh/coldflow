CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hashed_key" text NOT NULL,
	"prefix" text NOT NULL,
	"user_id" text NOT NULL,
	"sub_agency_id" text,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "api_key_hashed_key_unique" UNIQUE("hashed_key")
);
--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_sub_agency_id_sub_agency_id_fk" FOREIGN KEY ("sub_agency_id") REFERENCES "public"."sub_agency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_key_userId_idx" ON "api_key" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_key_hashedKey_idx" ON "api_key" USING btree ("hashed_key");--> statement-breakpoint
CREATE INDEX "api_key_subAgencyId_idx" ON "api_key" USING btree ("sub_agency_id");--> statement-breakpoint
CREATE INDEX "api_key_userId_subAgencyId_idx" ON "api_key" USING btree ("user_id","sub_agency_id");