import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_articles_v_blocks_paragraph" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_articles_v_blocks_heading" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_articles_v_blocks_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"attribution" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_articles_v_blocks_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ordered" boolean,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_category_id" integer,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_reading_minutes" numeric,
  	"version_image_src" varchar,
  	"version_image_alt" varchar,
  	"version_image_credit" varchar,
  	"version_featured" boolean,
  	"version_breaking" boolean,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_legacy_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_articles_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "articles_blocks_paragraph" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "articles_blocks_heading" ALTER COLUMN "level" DROP NOT NULL;
  ALTER TABLE "articles_blocks_heading" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "articles_blocks_quote" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "excerpt" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "category_id" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "author_id" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "published_at" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "reading_minutes" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "image_src" DROP NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "image_alt" DROP NOT NULL;
  ALTER TABLE "articles" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "articles" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "articles" ADD COLUMN "_status" "enum_articles_status" DEFAULT 'draft';
  ALTER TABLE "_articles_v_blocks_paragraph" ADD CONSTRAINT "_articles_v_blocks_paragraph_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_heading" ADD CONSTRAINT "_articles_v_blocks_heading_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_quote" ADD CONSTRAINT "_articles_v_blocks_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_blocks_list" ADD CONSTRAINT "_articles_v_blocks_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v" ADD CONSTRAINT "_articles_v_version_author_id_authors_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articles_v_texts" ADD CONSTRAINT "_articles_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_articles_v_blocks_paragraph_order_idx" ON "_articles_v_blocks_paragraph" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_paragraph_parent_id_idx" ON "_articles_v_blocks_paragraph" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_paragraph_path_idx" ON "_articles_v_blocks_paragraph" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_heading_order_idx" ON "_articles_v_blocks_heading" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_heading_parent_id_idx" ON "_articles_v_blocks_heading" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_heading_path_idx" ON "_articles_v_blocks_heading" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_quote_order_idx" ON "_articles_v_blocks_quote" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_quote_parent_id_idx" ON "_articles_v_blocks_quote" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_quote_path_idx" ON "_articles_v_blocks_quote" USING btree ("_path");
  CREATE INDEX "_articles_v_blocks_list_order_idx" ON "_articles_v_blocks_list" USING btree ("_order");
  CREATE INDEX "_articles_v_blocks_list_parent_id_idx" ON "_articles_v_blocks_list" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_blocks_list_path_idx" ON "_articles_v_blocks_list" USING btree ("_path");
  CREATE INDEX "_articles_v_parent_idx" ON "_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "_articles_v" USING btree ("version_slug");
  CREATE INDEX "_articles_v_version_version_category_idx" ON "_articles_v" USING btree ("version_category_id");
  CREATE INDEX "_articles_v_version_version_author_idx" ON "_articles_v" USING btree ("version_author_id");
  CREATE INDEX "_articles_v_version_version_published_at_idx" ON "_articles_v" USING btree ("version_published_at");
  CREATE INDEX "_articles_v_version_version_legacy_id_idx" ON "_articles_v" USING btree ("version_legacy_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_latest_idx" ON "_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "_articles_v" USING btree ("autosave");
  CREATE INDEX "_articles_v_texts_order_parent" ON "_articles_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "articles__status_idx" ON "articles" USING btree ("_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_articles_v_blocks_paragraph" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_blocks_heading" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_blocks_quote" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_blocks_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articles_v_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_articles_v_blocks_paragraph" CASCADE;
  DROP TABLE "_articles_v_blocks_heading" CASCADE;
  DROP TABLE "_articles_v_blocks_quote" CASCADE;
  DROP TABLE "_articles_v_blocks_list" CASCADE;
  DROP TABLE "_articles_v" CASCADE;
  DROP TABLE "_articles_v_texts" CASCADE;
  DROP INDEX "articles__status_idx";
  ALTER TABLE "articles_blocks_paragraph" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "articles_blocks_heading" ALTER COLUMN "level" SET NOT NULL;
  ALTER TABLE "articles_blocks_heading" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "articles_blocks_quote" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "excerpt" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "category_id" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "author_id" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "published_at" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "reading_minutes" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "image_src" SET NOT NULL;
  ALTER TABLE "articles" ALTER COLUMN "image_alt" SET NOT NULL;
  ALTER TABLE "articles" DROP COLUMN "meta_title";
  ALTER TABLE "articles" DROP COLUMN "meta_description";
  ALTER TABLE "articles" DROP COLUMN "_status";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum__articles_v_version_status";`)
}
