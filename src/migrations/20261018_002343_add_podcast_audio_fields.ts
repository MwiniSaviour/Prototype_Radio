import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "podcast_episodes" ADD COLUMN "audio_url" varchar;
  ALTER TABLE "podcast_episodes" ADD COLUMN "audio_mime_type" varchar;
  ALTER TABLE "podcast_episodes" ADD COLUMN "audio_byte_length" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "podcast_episodes" DROP COLUMN "audio_url";
  ALTER TABLE "podcast_episodes" DROP COLUMN "audio_mime_type";
  ALTER TABLE "podcast_episodes" DROP COLUMN "audio_byte_length";`)
}
