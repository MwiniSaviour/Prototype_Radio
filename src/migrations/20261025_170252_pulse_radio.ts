import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_tags" AS ENUM('Music', 'Comedy', 'Food & Drink', 'Community', 'Festival', 'Party', 'Live Show');
  CREATE TYPE "public"."enum_events_tiers_icon" AS ENUM('ticket', 'crown');
  CREATE TYPE "public"."enum_events_amenities_icon" AS ENUM('music', 'drink', 'heart', 'star');
  CREATE TYPE "public"."enum_tickets_status" AS ENUM('confirmed', 'pending', 'past');
  CREATE TABLE "stations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"frequency" varchar NOT NULL,
  	"city" varchar NOT NULL,
  	"tagline" varchar NOT NULL,
  	"artwork_src" varchar NOT NULL,
  	"artwork_alt" varchar NOT NULL,
  	"artwork_credit" varchar,
  	"stream_url" varchar,
  	"flagship" boolean DEFAULT false,
  	"live" boolean DEFAULT false,
  	"legacy_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_events_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "events_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tier_id" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"icon" "enum_events_tiers_icon" NOT NULL
  );
  
  CREATE TABLE "events_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"icon" "enum_events_amenities_icon" NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"venue" varchar NOT NULL,
  	"city" varchar NOT NULL,
  	"distance_km" numeric NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"start_time" varchar NOT NULL,
  	"end_time" varchar NOT NULL,
  	"image_src" varchar NOT NULL,
  	"image_alt" varchar NOT NULL,
  	"image_credit" varchar,
  	"featured" boolean DEFAULT false,
  	"price_from" numeric NOT NULL,
  	"legacy_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "tickets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"owner_email" varchar NOT NULL,
  	"tier_id" varchar NOT NULL,
  	"tier_name" varchar NOT NULL,
  	"quantity" numeric DEFAULT 1 NOT NULL,
  	"status" "enum_tickets_status" DEFAULT 'confirmed' NOT NULL,
  	"reference" varchar NOT NULL,
  	"legacy_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "listeners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"avatar_url" varchar NOT NULL,
  	"notifications_enabled" boolean DEFAULT true,
  	"legacy_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "listeners_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tickets_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "listeners_id" integer;
  ALTER TABLE "events_tags" ADD CONSTRAINT "events_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_tiers" ADD CONSTRAINT "events_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_amenities" ADD CONSTRAINT "events_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_texts" ADD CONSTRAINT "events_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listeners_rels" ADD CONSTRAINT "listeners_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."listeners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "listeners_rels" ADD CONSTRAINT "listeners_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "stations_slug_idx" ON "stations" USING btree ("slug");
  CREATE UNIQUE INDEX "stations_legacy_id_idx" ON "stations" USING btree ("legacy_id");
  CREATE INDEX "stations_updated_at_idx" ON "stations" USING btree ("updated_at");
  CREATE INDEX "stations_created_at_idx" ON "stations" USING btree ("created_at");
  CREATE INDEX "events_tags_order_idx" ON "events_tags" USING btree ("order");
  CREATE INDEX "events_tags_parent_idx" ON "events_tags" USING btree ("parent_id");
  CREATE INDEX "events_tiers_order_idx" ON "events_tiers" USING btree ("_order");
  CREATE INDEX "events_tiers_parent_id_idx" ON "events_tiers" USING btree ("_parent_id");
  CREATE INDEX "events_amenities_order_idx" ON "events_amenities" USING btree ("_order");
  CREATE INDEX "events_amenities_parent_id_idx" ON "events_amenities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_date_idx" ON "events" USING btree ("date");
  CREATE UNIQUE INDEX "events_legacy_id_idx" ON "events" USING btree ("legacy_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events_texts_order_parent" ON "events_texts" USING btree ("order","parent_id");
  CREATE INDEX "tickets_event_idx" ON "tickets" USING btree ("event_id");
  CREATE INDEX "tickets_owner_email_idx" ON "tickets" USING btree ("owner_email");
  CREATE UNIQUE INDEX "tickets_reference_idx" ON "tickets" USING btree ("reference");
  CREATE UNIQUE INDEX "tickets_legacy_id_idx" ON "tickets" USING btree ("legacy_id");
  CREATE INDEX "tickets_updated_at_idx" ON "tickets" USING btree ("updated_at");
  CREATE INDEX "tickets_created_at_idx" ON "tickets" USING btree ("created_at");
  CREATE UNIQUE INDEX "listeners_email_idx" ON "listeners" USING btree ("email");
  CREATE UNIQUE INDEX "listeners_legacy_id_idx" ON "listeners" USING btree ("legacy_id");
  CREATE INDEX "listeners_updated_at_idx" ON "listeners" USING btree ("updated_at");
  CREATE INDEX "listeners_created_at_idx" ON "listeners" USING btree ("created_at");
  CREATE INDEX "listeners_rels_order_idx" ON "listeners_rels" USING btree ("order");
  CREATE INDEX "listeners_rels_parent_idx" ON "listeners_rels" USING btree ("parent_id");
  CREATE INDEX "listeners_rels_path_idx" ON "listeners_rels" USING btree ("path");
  CREATE INDEX "listeners_rels_stations_id_idx" ON "listeners_rels" USING btree ("stations_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tickets_fk" FOREIGN KEY ("tickets_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_listeners_fk" FOREIGN KEY ("listeners_id") REFERENCES "public"."listeners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_stations_id_idx" ON "payload_locked_documents_rels" USING btree ("stations_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_tickets_id_idx" ON "payload_locked_documents_rels" USING btree ("tickets_id");
  CREATE INDEX "payload_locked_documents_rels_listeners_id_idx" ON "payload_locked_documents_rels" USING btree ("listeners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_tiers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_amenities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tickets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "listeners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "listeners_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "stations" CASCADE;
  DROP TABLE "events_tags" CASCADE;
  DROP TABLE "events_tiers" CASCADE;
  DROP TABLE "events_amenities" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_texts" CASCADE;
  DROP TABLE "tickets" CASCADE;
  DROP TABLE "listeners" CASCADE;
  DROP TABLE "listeners_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tickets_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_listeners_fk";
  
  DROP INDEX "payload_locked_documents_rels_stations_id_idx";
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_tickets_id_idx";
  DROP INDEX "payload_locked_documents_rels_listeners_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tickets_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "listeners_id";
  DROP TYPE "public"."enum_events_tags";
  DROP TYPE "public"."enum_events_tiers_icon";
  DROP TYPE "public"."enum_events_amenities_icon";
  DROP TYPE "public"."enum_tickets_status";`)
}
