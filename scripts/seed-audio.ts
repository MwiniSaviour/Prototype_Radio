import { getPayload } from 'payload'

import { podcastEpisodes } from '../src/data/podcasts'
import config from '../src/payload.config'

const payload = await getPayload({ config })

type Status = 'updated' | 'skipped'

// Driven dynamically through a facade like seed.ts, so the update payload is
// freed from generated-type variance while the fixture walk below stays typed.
interface AudioSeedApi {
  find(options: {
    collection: 'podcast-episodes'
    where: { legacyId: { equals: string } }
    depth: number
    limit: number
    overrideAccess: boolean
  }): Promise<{ docs: Record<string, unknown>[] }>
  update(options: {
    collection: 'podcast-episodes'
    id: number
    data: Record<string, unknown>
    overrideAccess: boolean
  }): Promise<Record<string, unknown>>
}

const api = payload as unknown as AudioSeedApi

const baseUrl = process.env.AUDIO_SAMPLE_BASE_URL

const tally: Record<Status, number> = { updated: 0, skipped: 0 }

console.log('Seeding podcast episode audio fields...')

for (const episode of podcastEpisodes) {
  if (!baseUrl) {
    console.log(`skipped   podcast-episodes ${episode.slug} — AUDIO_SAMPLE_BASE_URL not configured`)
    tally.skipped += 1
    continue
  }

  const found = await api.find({
    collection: 'podcast-episodes',
    where: { legacyId: { equals: episode.id } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  if (found.docs.length === 0) {
    throw new Error(`seed-audio: no podcast-episodes row with legacyId "${episode.id}"`)
  }

  const doc = found.docs[0]
  const id = doc.id as number

  if (typeof doc.audioUrl === 'string' && doc.audioUrl.length > 0) {
    console.log(`skipped   podcast-episodes ${episode.slug} (id ${id}) — audioUrl already set`)
    tally.skipped += 1
    continue
  }

  await api.update({
    collection: 'podcast-episodes',
    id,
    data: {
      audioUrl: `${baseUrl}/${episode.slug}-sample.mp3`,
      audioMimeType: 'audio/mpeg',
      audioByteLength: null,
    },
    overrideAccess: true,
  })
  console.log(`updated   podcast-episodes ${episode.slug} (id ${id})`)
  tally.updated += 1
}

console.log(`updated: ${tally.updated}, skipped: ${tally.skipped} of ${podcastEpisodes.length}`)

await payload.destroy()
