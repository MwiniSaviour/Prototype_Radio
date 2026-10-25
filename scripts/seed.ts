import { getPayload } from 'payload'

import { articles } from '../src/data/articles'
import { authors } from '../src/data/authors'
import { categories } from '../src/data/categories'
import { breakingTicker, footerColumns, primaryNav, socialLinks } from '../src/data/nav'
import { events, listener, tickets } from '../src/data/events'
import { podcastEpisodes } from '../src/data/podcasts'
import { shows } from '../src/data/shows'
import { stations } from '../src/data/stations'
import { siteConfig } from '../src/lib/constants'
import type { ArticleBlock } from '../src/lib/types'
import type { Config as GeneratedConfig } from '../src/payload-types'
import config from '../src/payload.config'

const payload = await getPayload({ config })

type SeedCollection =
  | 'categories'
  | 'authors'
  | 'shows'
  | 'podcast-episodes'
  | 'articles'
  | 'stations'
  | 'events'
  | 'tickets'
  | 'listeners'
type Status = 'created' | 'updated' | 'unchanged'

type SeedData<C extends SeedCollection> = Omit<
  GeneratedConfig['collections'][C],
  'id' | 'createdAt' | 'updatedAt'
>

/**
 * The Local API is generic over the concrete collection slug; this seed drives it
 * dynamically, so it goes through a structural facade. Fixture mapping below still
 * type-checks against the generated document types.
 */
interface SeedApi {
  find(options: {
    collection: SeedCollection
    where: { legacyId: { equals: string } }
    depth: number
    limit: number
    overrideAccess: boolean
  }): Promise<{ docs: Record<string, unknown>[] }>
  create(options: {
    collection: SeedCollection
    data: Record<string, unknown>
    overrideAccess: boolean
  }): Promise<{ id: number }>
  update(options: {
    collection: SeedCollection
    id: number
    data: Record<string, unknown>
    overrideAccess: boolean
  }): Promise<{ id: number }>
}

const api = payload as unknown as SeedApi

const collections: SeedCollection[] = [
  'categories',
  'authors',
  'shows',
  'podcast-episodes',
  'articles',
  'stations',
  'events',
  'tickets',
  'listeners',
]

const tally: Record<SeedCollection, Record<Status, number>> = {
  categories: { created: 0, updated: 0, unchanged: 0 },
  authors: { created: 0, updated: 0, unchanged: 0 },
  shows: { created: 0, updated: 0, unchanged: 0 },
  'podcast-episodes': { created: 0, updated: 0, unchanged: 0 },
  articles: { created: 0, updated: 0, unchanged: 0 },
  stations: { created: 0, updated: 0, unchanged: 0 },
  events: { created: 0, updated: 0, unchanged: 0 },
  tickets: { created: 0, updated: 0, unchanged: 0 },
  listeners: { created: 0, updated: 0, unchanged: 0 },
}

/**
 * Canonical string over the keys present in `shape` only, so stored documents can
 * be compared against the desired payload without tripping over Payload-injected
 * fields (numeric id, array-row ids, blockName, createdAt/updatedAt).
 */
function canonical(value: unknown, shape: unknown): string {
  if (Array.isArray(shape)) {
    const rows = Array.isArray(value) ? value : []
    return `[${shape.map((row, index) => canonical(rows[index], row)).join(',')}]`
  }
  if (shape !== null && typeof shape === 'object') {
    const source =
      value !== null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {}
    const keys = Object.keys(shape as Record<string, unknown>).sort()
    return `{${keys
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonical(source[key], (shape as Record<string, unknown>)[key])}`,
      )
      .join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

function requireId(ids: Map<string, number>, legacyId: string, kind: string, owner: string): number {
  const id = ids.get(legacyId)
  if (id === undefined) {
    throw new Error(`seed: ${owner} references unknown ${kind} legacyId "${legacyId}"`)
  }
  return id
}

function note(collection: SeedCollection, status: Status, legacyId: string, id: number): void {
  tally[collection][status] += 1
  if (status !== 'unchanged') {
    console.log(`${status.padEnd(9)} ${collection.padEnd(16)} ${legacyId} (id ${id})`)
  }
}

async function upsert<C extends SeedCollection>(collection: C, data: SeedData<C>): Promise<number> {
  const { legacyId } = data
  if (typeof legacyId !== 'string' || legacyId.length === 0) {
    throw new Error(`seed: a ${collection} fixture document is missing its legacyId`)
  }

  const record = data as Record<string, unknown>
  const found = await api.find({
    collection,
    where: { legacyId: { equals: legacyId } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  if (found.docs.length === 0) {
    const created = await api.create({ collection, data: record, overrideAccess: true })
    note(collection, 'created', legacyId, created.id)
    return created.id
  }

  const existing = found.docs[0]
  const id = existing.id as number
  if (canonical(existing, record) === canonical(record, record)) {
    note(collection, 'unchanged', legacyId, id)
    return id
  }

  const updated = await api.update({ collection, id, data: record, overrideAccess: true })
  note(collection, 'updated', legacyId, updated.id)
  return updated.id
}

function toBodyBlock(block: ArticleBlock) {
  switch (block.type) {
    case 'paragraph':
      return { blockType: 'paragraph' as const, text: block.text }
    case 'heading':
      return { blockType: 'heading' as const, level: block.level, text: block.text }
    case 'quote':
      return {
        blockType: 'quote' as const,
        text: block.text,
        attribution: block.attribution ?? null,
      }
    case 'list':
      return { blockType: 'list' as const, ordered: block.ordered ?? false, items: [...block.items] }
  }
}

console.log('Seeding categories...')
const categoryIds = new Map<string, number>()
for (const category of categories) {
  const id = await upsert('categories', {
    slug: category.slug,
    name: category.name,
    description: category.description,
    icon: category.icon,
    accentToken: category.accentToken,
    legacyId: category.id,
  })
  categoryIds.set(category.id, id)
}

console.log('Seeding authors...')
const authorIds = new Map<string, number>()
for (const author of authors) {
  const id = await upsert('authors', {
    slug: author.slug,
    name: author.name,
    role: author.role,
    avatarUrl: author.avatarUrl ?? null,
    bio: author.bio,
    location: author.location,
    specialisms: [...author.specialisms],
    social: author.social.map((link) => ({ label: link.label, href: link.href })),
    legacyId: author.id,
  })
  authorIds.set(author.id, id)
}

console.log('Seeding shows...')
const showIds = new Map<string, number>()
for (const show of shows) {
  const id = await upsert('shows', {
    slug: show.slug,
    name: show.name,
    tagline: show.tagline,
    description: show.description,
    hosts: show.hosts.map((host) => requireId(authorIds, host.id, 'author', show.id)),
    schedule: show.schedule.map((slot) => ({ day: slot.day, start: slot.start, end: slot.end })),
    image: {
      src: show.image.src,
      alt: show.image.alt,
      credit: show.image.credit ?? null,
    },
    category: show.category ? requireId(categoryIds, show.category.id, 'category', show.id) : null,
    legacyId: show.id,
  })
  showIds.set(show.id, id)
}

console.log('Seeding podcast episodes...')
for (const episode of podcastEpisodes) {
  await upsert('podcast-episodes', {
    slug: episode.slug,
    title: episode.title,
    description: episode.description,
    show: requireId(showIds, episode.showId, 'show', episode.id),
    season: episode.season,
    episodeNumber: episode.episodeNumber,
    publishedAt: episode.publishedAt,
    durationSeconds: episode.durationSeconds,
    image: {
      src: episode.image.src,
      alt: episode.image.alt,
      credit: episode.image.credit ?? null,
    },
    tags: [...episode.tags],
    legacyId: episode.id,
  })
}

console.log('Seeding articles...')
for (const article of articles) {
  await upsert('articles', {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: requireId(categoryIds, article.category.id, 'category', article.id),
    author: requireId(authorIds, article.author.id, 'author', article.id),
    publishedAt: article.publishedAt,
    readingMinutes: article.readingMinutes,
    image: {
      src: article.image.src,
      alt: article.image.alt,
      credit: article.image.credit ?? null,
    },
    tags: [...article.tags],
    featured: article.featured ?? false,
    breaking: article.breaking ?? false,
    body: article.body.map(toBodyBlock),
    legacyId: article.id,
  })
}

console.log('Seeding Pulse Radio stations...')
const stationIds = new Map<string, number>()
for (const station of stations) {
  const id = await upsert('stations', {
    slug: station.slug,
    name: station.name,
    frequency: station.frequency,
    city: station.city,
    tagline: station.tagline,
    artwork: {
      src: station.artwork.src,
      alt: station.artwork.alt,
      credit: station.artwork.credit ?? null,
    },
    streamUrl: station.streamUrl,
    flagship: station.flagship ?? false,
    live: station.live ?? false,
    legacyId: station.id,
  })
  stationIds.set(station.id, id)
}

console.log('Seeding events...')
const eventIds = new Map<string, number>()
for (const event of events) {
  const id = await upsert('events', {
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle,
    description: event.description,
    venue: event.venue,
    city: event.city,
    distanceKm: event.distanceKm,
    // Payload date fields store an ISO timestamp; the fixtures carry a plain
    // yyyy-mm-dd, so it is normalised at the boundary.
    date: new Date(`${event.date}T00:00:00.000Z`).toISOString(),
    startTime: event.startTime,
    endTime: event.endTime,
    image: {
      src: event.image.src,
      alt: event.image.alt,
      credit: event.image.credit ?? null,
    },
    tags: [...event.tags],
    featured: event.featured ?? false,
    priceFrom: event.priceFrom,
    tiers: event.tiers.map((tier) => ({
      tierId: tier.id,
      name: tier.name,
      description: tier.description,
      price: tier.price,
      perks: [...tier.perks],
      icon: tier.icon,
    })),
    amenities: event.amenities.map((amenity) => ({ label: amenity.label, icon: amenity.icon })),
    legacyId: event.id,
  })
  eventIds.set(event.id, id)
}

console.log('Seeding tickets...')
for (const ticket of tickets) {
  await upsert('tickets', {
    event: requireId(eventIds, ticket.eventId, 'event', ticket.id),
    ownerEmail: listener.email,
    tierId: ticket.tierId,
    tierName: ticket.tierName,
    quantity: ticket.quantity,
    status: ticket.status,
    reference: ticket.reference,
    legacyId: ticket.id,
  })
}

console.log('Seeding listeners...')
await upsert('listeners', {
  name: listener.name,
  email: listener.email,
  avatarUrl: listener.avatarUrl,
  favouriteStations: listener.favouriteStationIds.map((stationId) =>
    requireId(stationIds, stationId, 'station', listener.id),
  ),
  notificationsEnabled: listener.notificationsEnabled,
  legacyId: listener.id,
})

console.log('Seeding site settings...')
const settingsData = {
  siteName: siteConfig.name,
  siteDescription: siteConfig.description,
  primaryNav: primaryNav.map((item) => ({
    label: item.label,
    href: item.href,
    external: item.external ?? false,
  })),
  footerColumns: footerColumns.map((column) => ({
    heading: column.heading,
    links: column.links.map((link) => ({
      label: link.label,
      href: link.href,
      external: link.external ?? false,
    })),
  })),
  socialLinks: socialLinks.map((link) => ({ label: link.label, href: link.href })),
  breakingTicker: [...breakingTicker],
}

const currentSettings = await payload.findGlobal({
  slug: 'site-settings',
  depth: 0,
  overrideAccess: true,
})

let settingsStatus: Status = 'unchanged'
if (canonical(currentSettings, settingsData) !== canonical(settingsData, settingsData)) {
  const existing = Boolean((currentSettings as { createdAt?: string | null }).createdAt)
  await payload.updateGlobal({
    slug: 'site-settings',
    data: settingsData,
    overrideAccess: true,
  })
  settingsStatus = existing ? 'updated' : 'created'
}
console.log(`${settingsStatus.padEnd(9)} site-settings`)

const rowCounts: Record<SeedCollection, number> = {
  categories: (await payload.count({ collection: 'categories', overrideAccess: true })).totalDocs,
  authors: (await payload.count({ collection: 'authors', overrideAccess: true })).totalDocs,
  shows: (await payload.count({ collection: 'shows', overrideAccess: true })).totalDocs,
  'podcast-episodes': (
    await payload.count({ collection: 'podcast-episodes', overrideAccess: true })
  ).totalDocs,
  articles: (await payload.count({ collection: 'articles', overrideAccess: true })).totalDocs,
  stations: (await payload.count({ collection: 'stations', overrideAccess: true })).totalDocs,
  events: (await payload.count({ collection: 'events', overrideAccess: true })).totalDocs,
  tickets: (await payload.count({ collection: 'tickets', overrideAccess: true })).totalDocs,
  listeners: (await payload.count({ collection: 'listeners', overrideAccess: true })).totalDocs,
}
const userCount = (await payload.count({ collection: 'users', overrideAccess: true })).totalDocs
const settingsRows = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })).createdAt ? 1 : 0

console.log('')
console.log(
  `${'Collection'.padEnd(18)}${'Created'.padStart(8)}${'Updated'.padStart(8)}${'Unchanged'.padStart(10)}${'Rows'.padStart(6)}`,
)
console.log(
  `${'-'.repeat(18)}${'-'.repeat(8)}${'-'.repeat(8)}${'-'.repeat(10)}${'-'.repeat(6)}`,
)
const totals: Record<Status, number> = { created: 0, updated: 0, unchanged: 0 }
for (const collection of collections) {
  const row = tally[collection]
  totals.created += row.created
  totals.updated += row.updated
  totals.unchanged += row.unchanged
  console.log(
    `${collection.padEnd(18)}${String(row.created).padStart(8)}${String(row.updated).padStart(8)}${String(row.unchanged).padStart(10)}${String(rowCounts[collection]).padStart(6)}`,
  )
}
console.log(
  `${'site-settings'.padEnd(18)}${String(settingsStatus === 'created' ? 1 : 0).padStart(8)}${String(settingsStatus === 'updated' ? 1 : 0).padStart(8)}${String(settingsStatus === 'unchanged' ? 1 : 0).padStart(10)}${String(settingsRows).padStart(6)}`,
)
console.log(
  `${'Total'.padEnd(18)}${String(totals.created).padStart(8)}${String(totals.updated).padStart(8)}${String(totals.unchanged).padStart(10)}`,
)
console.log(`users: ${userCount} (untouched by the seed)`)

await payload.destroy()
