import { NextResponse, type NextRequest } from 'next/server'

/**
 * Seed the admin theme cookie so first visits to /admin render dark.
 *
 * Payload SSR always emits `data-theme` from cookie -> Sec-CH header ->
 * defaultTheme ('light'), so an un-themed request paints light and the
 * toggle only exists for logged-in users. Sealing dark here keeps the
 * admin dark-first while preserving the stock toggle ('all').
 *
 - Cookie name matches Payload's `${cookiePrefix}-theme`; the project does
 - not set cookiePrefix, so the default 'payload' prefix applies. Keep in
 - sync with src/payload.config.ts if a prefix is ever added.
 *
 * Only seeds when absent, so an explicit 'light' (or saved) choice is never
 * overridden. The toggle's 'auto' option deletes the cookie, which re-seeds
 * dark here — i.e. "auto" resolves to persistent dark; accepted as the
 * intended dark-first behavior.
 */
const THEME_COOKIE = 'payload-theme'

export function proxy(request: NextRequest) {
  if (request.cookies.has(THEME_COOKIE)) return NextResponse.next()

  // Mutate the request cookie so the same SSR pass reads it (no light
  // flash), then mirror onto the response so the browser persists it.
  // `request.cookies.set` updates the underlying Cookie header, which the
  // `request.headers` forward below propagates upstream.
  request.cookies.set(THEME_COOKIE, 'dark')
  const response = NextResponse.next({
    request: { headers: request.headers },
  })
  response.cookies.set({
    name: THEME_COOKIE,
    value: 'dark',
    path: '/',
    sameSite: 'lax', // matches browser default; not httpOnly (clients read it)
  })
  return response
}

export const config = {
  matcher: '/admin/:path*',
}
