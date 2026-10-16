# Live audio backend research — myradiowaa.com

**Target:** https://myradiowaa.com/ — "Radio Waa 92.1 FM", Wa, Upper West Region, Ghana
**Date of analysis:** 2026-10-15
**Method:** static analysis of HTML/CSS/JS fetched over the wire with `curl` + manual reading, plus
RESPONSE-header and RESPONSE-body byte inspection of the live stream. No browser was available.
**Purpose:** inform the live-audio backend design for a Next.js 16 rebuild of this brand.

---

## 0. Method & limitations (browser-less static analysis)

### What I actually did

| Activity | Tool | Result |
|---|---|---|
| Fetch homepage, story page, search page, sitemap, robots | `curl` | ✅ done |
| Fetch and read every JS/CSS/manifest asset referenced by the HTML | `curl` | ✅ done |
| Read the complete 6,804-byte `app.js` and 902-byte `sw.js` end-to-end | manual | ✅ done |
| Issue `HEAD`/`GET` against the stream URL, follow redirects, capture full response headers | `curl -D -` | ✅ done |
| Download ~33–50 KB of stream body and parse frame headers in Python to identify the codec | Python | ✅ done |
| Base64-decode the CDN redirect JWT and read its claims | Python | ✅ done |
| Probe ~30 candidate endpoint paths for a now-playing/schedule API | `curl` | ✅ done (all 404) |
| `rea analyze` (JS application mode) on the downloaded asset directory | REA CLI | ✅ succeeded (evidence `ev_4c4cca…`) |
| `rea search` for audio/stream strings | REA CLI | ❌ **unavailable — see below** |
| `rea_extract_strings` | REA CLI | ❌ subcommand does not exist in this build |

**REA was only partially usable, and I want to be explicit about why.** `rea analyze wa-js` ran
successfully in `analyze_javascript_application` mode and inventoried + parsed all three JS-source
assets. But `rea search` then failed on the resulting target with
`target_unavailable / directory_requires_file` ("this opening route requires a file or app bundle"),
and targeting the individual file `static_js_app.js` failed with
`capability_unavailable / unsupported_provider` (a bare `.js` file is not a supported
string-analysis target). `rea extract_strings` returns `COMMAND_NOT_FOUND`. So REA gave me a parse
pass and an evidence hash, but **zero string-search results**. In practice this cost nothing: the
entire player bundle is 6.8 KB and I read all of it by hand, which is strictly stronger evidence
than a grep index would be. REA's browser/CDP tools (`rea_inspect_web_page`,
`rea_analyze_web_bundle`, `rea_capture_browser_scenario`, `rea_export_web_scripts`) require a live
Chrome DevTools Protocol endpoint, which does not exist on this host, so none were attempted.

### What this method can and cannot prove

**Can prove:**
- The exact bytes of the HTML, JS, CSS, and manifest served to an anonymous client.
- The exact HTTP response headers the stream endpoint returns.
- The actual codec and bitrate, read from decoded frame headers.
- Which URLs exist and which return 404.
- That no now-playing/schedule API is reachable at any of 30 probed paths.

**Cannot prove:**
- **That playback actually works.** I never rendered the page. I never pressed play.
- **Actual measured latency or rebuffer behaviour in a real browser.** The `<audio>` element's
  own buffer strategy and startup time are browser-internal.
- **What happens when the station is off-air.** I only sampled during on-air periods (the stream
  carried real programme audio — 132 AAC frames, continuous frames with no silence gaps).
- **What a logged-in or geo-restricted client sees.** All probes were anonymous, from Ghana.
- **Whether the Zeno/SurferNetwork contract permits redistribution** (§8.7 — this is the single
  most consequential unknown).
- **Whether `type="audio/mpeg"` causes a real failure in any specific browser** (§4.4) — I reasoned
  about it but could not test it.

### Honest correction to the task brief

The task said to start from pre-existing captures in
`/data/data/com.termux/files/usr/tmp/opencode/`. **That directory did not exist** — it contained
only an unrelated `radio-waa-server.log` (a Next.js dev-server log). Every finding below was
re-derived from the live site. Several files named in the brief **do not exist on the live site**:

| Brief named | Reality (2026-10-15) |
|---|---|
| `shows.html` (weekly schedule page) | **HTTP 404 — there is no schedule page.** |
| `wa-manifest.json` (PWA manifest) | **HTTP 404.** The manifest is at `/static/pwa/manifest.json`. |
| `mg-radiowaa.html`, `article.html` (bare), `home.html` | 404. Real routes are `/`, `/search/`, `/story/<slug>/`. |
| `site.css` | Real file is `/static/css/style.css` (239 bytes). |

The sitemap contains 118 URLs: **116 `/story/<slug>/` pages, `/`, and `/search/`.** Nothing else.
The claimed weekly schedule page does not exist. This materially changes the EPG half of the
investigation (§5).

---

## 1. Summary of findings

A live stream **was found**, and it is real and currently on air. It is a **managed CDN rebroadcast
chain**, not a self-hosted server:

```
Browser <audio>
   → https://stream.zeno.fm/nc7uemx3z98uv        (Zeno.fm edge — short-lived JWT issuer)
   → 302 → https://stream-178.surfernetwork.com/nc7uemx3z98uv?zt=<HS256 JWT, 60s TTL>
   → 200, audio/aac, ICY, chunked, ACAO: *
```

**Headline facts:**

1. **Protocol: progressive (chunked) MPEG-4 AAC in ADTS framing. Not HLS. Not MP3. Not Icecast.**
   `content-type: audio/aac`, confirmed by frame parsing: ADTS sync `0xFFF`, profile AAC-LC,
   44,100 Hz, stereo, `icy-br: 128`.
2. **The site has no player library.** Native `<audio controls>` driven by 6.8 KB of hand-written
   vanilla JS. No Howler, jPlayer, Plyr, MediaElement, RadioJS, SoundManager, or hls.js.
3. **The site's `<source>` declares `type="audio/mpeg"` but the origin serves `audio/aac`** — a
   real MIME mismatch (§4.4).
4. **There is no `.m3u8` HLS. The `.m3u8` URL that returns 200 is a 36-byte redirect stub**, not a
   playlist — no `#EXTM3U`, no segments, no bitrate ladder.
5. **There is no now-playing data and no EPG at all.** No `icy-metaint`, no schedule page, no API,
   no CMS field. The on-air label is a hardcoded string.
6. **CORS is fine** (`access-control-allow-origin: *` on both legs), so the JS's
   `crossorigin="anonymous"` is safe. My initial suspicion that it would break playback was wrong.
7. **The fallback machinery is decorative.** `app.js` contains an elaborate multi-source
   source-fallback loop that is dead code, because it first deletes all HTML `<source>` elements and
   appends exactly one. There is no second URL to fall back to (§4.5).
8. **The PWA service worker will fight the live stream.** It is a naive network-first cache that
   calls `cache.put()` on *every* GET including the cross-origin audio request (§7).
9. **Bonus security finding:** Django `DEBUG = True` is enabled in production — the site serves
   Django's technical 404 page, leaking the URLconf name and server stack (§4.7).

**Confidence that a live radio stream is in production use: high.** Confirmed from source, from
response headers, and from decoded audio bytes.

---

## 2. Player & markup

### 2.1 The exact markup (confirmed)

Byte-identical in the Django base template on `/`, `/story/<slug>/`, and `/search/`. Rendered in a
fixed bottom-right widget:

```html
<div id="live-audio-bar" class="fixed bottom-5 right-5 z-50 max-w-sm rounded-3xl border border-white/20 bg-white/95 p-4 shadow-2xl backdrop-blur-sm transition-all duration-200">
    <div class="flex items-center justify-between gap-4 mb-3">
        <div>
            <p class="text-sm font-semibold text-gray-900">Live radio</p>
            <p id="audio-status-label" class="text-xs text-gray-500">Radiowaa 92.1 FM</p>
        </div>
        <button id="audio-status-toggle" type="button" class="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-white text-sm font-semibold hover:bg-brand-700 transition">
            Pause
        </button>
    </div>
    <audio id="radio-player" controls controlsList="nodownload" preload="metadata" class="w-full rounded-3xl bg-black/10">
        <source src="https://stream.zeno.fm/nc7uemx3z98uv" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>
</div>
```

Key markup attributes and what they mean:

| Attribute | Value | Assessment |
|---|---|---|
| `controls` | native | Browser default chrome. No custom UI/skinning. |
| `controlsList` | `nodownload` | Cosmetic only. Does **not** prevent recording a stream. |
| `preload` | `metadata` | Reasonable for an infinite live stream. |
| `src` (source) | `https://stream.zeno.fm/nc7uemx3z98uv` | The stable public URL. |
| `type` | **`audio/mpeg`** | **Wrong** — the origin serves `audio/aac` (§4.4). |
| `crossorigin` | `anonymous` | **Set by JS, not in the HTML.** Safe (§4.6). |
| `playsinline` | `true` | Set by JS. Mobile-correct. |
| autoplay | — | **Absent.** No autoplay. Correct: browsers block it and it would be hostile. |

### 2.2 There is a second, separate "live" anchor — and it holds no player

The header nav, mobile nav, and footer all link to `/#live-player`:

```html
<a href="/#live-player" class="text-white/90 hover:text-white px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition">Live Stream</a>
```

```html
<section id="live-player" class="bg-brand-700 text-white rounded-3xl p-6 mt-6 shadow-lg">
    <div class="max-w-6xl mx-auto flex flex-col lg:flex-row items-start lg:items-center gap-6">
        <div class="flex-1">
            <p class="text-xs uppercase tracking-[0.24em] text-brand-200">Live Broadcast</p>
            <h1 class="mt-3 text-3xl sm:text-4xl font-extrabold text-white">Listen live on Radio Waa 92.1 FM</h1>
            <p class="mt-3 max-w-2xl text-sm sm:text-base text-brand-100">Enjoy our live radio broadcast without leaving the website. Press play and keep browsing while the stream continues.</p>
        </div>
        <div class="w-full lg:w-auto rounded-3xl bg-white/10 p-4">
            <div class="text-white text-sm leading-relaxed">
                Your live stream is available in the bottom-right audio player so it keeps playing while you browse.
            </div>
        </div>
    </div>
</section>
```

So `#live-player` is a **promotional hero banner with no player in it** — the copy explicitly
redirects the user to the floating widget. Not a broken anchor, but a real UX seam: the
"Live Stream" nav item scrolls to a banner that tells you to look somewhere else.

### 2.3 Player library and version

**None. There is no player library.** Confirmed by reading the entire script inventory:

| Asset | Raw bytes | Gzip | Role |
|---|---|---|---|
| `/static/js/app.js` | 6,804 | 2,283 | The entire client-side app, incl. the player |
| `/static/pwa/sw.js` | 902 | 404 | Service worker |
| `/static/css/style.css` | 239 | 434 | Tailwind supplement |
| `/static/pwa/manifest.json` | 239 | 394 | PWA manifest |

There is **no bundler, no build step, no `package.json` artifact, no chunking, no source map.**
The whole front end is three CDN dependencies plus one hand-written file:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/htmx.org@2.0.4"></script>
<script src="/static/js/app.js"></script>
```

The only third-party JS with a discoverable version is **htmx.org 2.0.4** (pinned in the URL) —
used only for the newsletter `hx-post`/`hx-swap`/`hx-target` form, not for audio. `cdn.tailwindcss.com`
is the Tailwind Play CDN (version not pinned; it is a JIT-in-browser runtime).

> **Note for our rebuild:** `cdn.tailwindcss.com` is explicitly not for production — it compiles
> Tailwind in the browser. We should not replicate this pattern in a Next.js app.

---

## 3. Stream endpoints found

Every row below was verified by me directly. "Confidence" reflects evidence quality.

| # | URL | Type | Evidence | Confidence |
|---|---|---|---|---|
| 1 | `https://stream.zeno.fm/nc7uemx3z98uv` | Progressive live AAC; **the URL the site actually uses** | `<source src=...>` in `index.html`, `story.html`, `search.html`; re-declared in `app.js`; `200 audio/aac`, `icy-name: Radio Waa 92.1 FM`, `icy-br: 128` | **Confirmed** |
| 2 | `https://stream-178.surfernetwork.com/nc7uemx3z98uv?zt=<JWT>` | The 302 target — real CDN origin | `location:` header captured verbatim; `200 audio/aac` when requested with the token | **Confirmed** |
| 3 | `https://stream.zeno.fm/nc7uemx3z98uv.m3u8` | **Redirect stub, not HLS.** Body is 36 bytes: `https://stream.zeno.fm/nc7uemx3z98uv` | `200`, `content-type: audio/x-mpegurl;charset=UTF-8`, `content-disposition: inline;filename=f.txt`, full body captured | **Confirmed stub** |
| 4 | `https://stream.surfernetwork.com/nc7uemx3z98uv.m3u8` | Same 36-byte stub | Body captured | **Confirmed stub** |
| 5 | `https://stream.surfernetwork.com/nc7uemx3z98uv;listen` | **404** | No Icecast mountpoint | **Confirmed absent** |
| 6 | `https://stream.zeno.fm/nc7uemx3z98uv;listen` | **404** | No Icecast mountpoint | **Confirmed absent** |
| 7 | `https://stream.zeno.fm/nc7uemx3z98uv.mp3` | 302 → **same AAC stream** | Format extension is ignored; no MP3 variant exists | **Confirmed absent** |
| 8 | `https://stream.zeno.fm/nc7uemx3z98uv.aac` | 302 → same AAC stream | — | **Confirmed absent** |
| 9 | `https://stream.zeno.fm/nc7uemx3z98uv/listen` | 302 → same AAC stream | — | **Confirmed absent** |
| 10 | `https://stream.zeno.fm/nc7uemx3z98uv/playlist.m3u8` | 302 → same AAC stream | — | **Confirmed absent** |
| 11 | `https://stream.surfernetwork.com/nc7uemx3z98uv/` (no token) | 302 → `https://stream.surfernetwork.com/nc7uemx3z98uv` (drops tenant host) | Token-less origin URL normalises to the generic host | **Confirmed** |
| 12 | `https://stream.zeno.fm/` | `200`, `Service ready.` | Root health string | **Confirmed** |
| 13 | `https://www.youtube.com/@RadioWaa921` | YouTube channel, link in footer | `<a href=...>` in footer. **Not embedded.** No `<iframe>`, no `<video>`, no YouTube API on the page. | **Confirmed link only** |
| 14 | Any now-playing / schedule / EPG endpoint | **None found.** 30 paths probed, all 404 | §5.2 | **Confirmed absent (probed set)** |

### 3.1 The redirect token (decoded)

Zeno issues a **new HS256 JWT on every single request**. Decoded payload:

```json
{
  "stream": "nc7uemx3z98uv",
  "host":   "stream-178.surfernetwork.com",
  "rttl":   5,
  "jti":    "HC9BzA349FF1e9D3",
  "at":     1792096147,
  "exp":    1792096207
}
```

| Claim | Meaning |
|---|---|
| `rttl: 5` | Radio TTL = 5 minutes. Classic SHOUTcast/Icecast reload semantics. |
| `exp - at` | **60 seconds.** Observed consistently across samples. |
| `jti` | Unique per request — six distinct `jti` values observed across six requests. |
| `host` | Tenant-specific origin: `stream-178` ⇒ SurferNetwork node 178. |
| `cache-control: no-cache` | On the 302. Confirms it must not be cached. |

**Design implication:** this is a **signed, 60-second-lifetime redirector**. The stable URL
(`stream.zeno.fm/<id>`) is the API; the CDN URL is a per-request artefact. If you cache the CDN URL
or store it in config, it expires in 60 seconds. Anything we build must either hit the stable Zeno
URL directly or re-resolve the redirect on every connection.

---

## 4. Delivery architecture

### 4.1 Topology

```
┌─────────────┐   HTML+JS    ┌──────────────────────────────────┐
│   Django    │◄────────────►│  myradiowaa.com                  │
│  (Apache /  │              │  Django template + app.js (6.8KB)│
│   Passenger)│              └──────────────────────────────────┘
└─────────────┘
                    │ <audio src>
                    ▼
        ┌────────────────────────────────┐
        │ stream.zeno.fm                 │  Zeno.fm edge
        │ 302 → surfernetwork + JWT(60s) │  (token issuer)
        └────────────────────────────────┘
                    │ 302, cache-control: no-cache
                    ▼
   ┌──────────────────────────────────────────────┐
   │ stream-178.surfernetwork.com                  │  SurferNetwork CDN
   │ 200 audio/aac, chunked, ACAO:*               │  node 178
   └──────────────────────────────────────────────┘
                    ▲
                    │ (origin studio encoder is NOT reachable
                    │  from here — chain of custody unknown)
```

Origin server identity and the studio encoder are **upstream of what I can see**. SurferNetwork is a
long-standing US internet-radio host (formerly Broadway Radio Networks). Whether Radio Waa
originates its own Icecast and is ingested by SurferNetwork, or buys a managed SurferNetwork
"station" outright, I cannot tell from the outside.

### 4.2 Protocol — confirmed progressive AAC, definitively not HLS

Decoded from the actual response headers:

```http
HTTP/1.1 200 OK
transfer-encoding: chunked
content-type: audio/aac
icy-name: Radio Waa 92.1 FM
icy-br: 128
access-control-allow-origin: *
referrer-policy: no-referrer
```

And from the response body — first 16 bytes, and the parsed ADTS frame headers:

```
ff f1 50 80 2e df fc 21 1a cf ff ff ff ff f0 8d ba d1 60 a8 43 43 9e 39 e0 16 cf af 59 c6 fa 9a
```

| Field | Parsed value | Derivation |
|---|---|---|
| Syncword | `0xFFF` | `ff` + `f1` |
| MPEG version | **MPEG-4** (not MPEG-1) | bit 11–12 of byte 2 = `1` |
| AAC profile | **AAC-LC** (profile 1) | byte 2 bits 7–6 = `01` |
| Sample rate index | 4 → **44,100 Hz** | byte 2 bits 5–2 = `0100` |
| Channels | **2 (stereo)** | `01` |
| Bitrate | **128 kbps** | `icy-br: 128`, and 380 B avg frame ÷ 23.22 ms = 131 kbps |
| Frame size | 374–405 bytes, avg 380.3 | parsed from 132 frames |

Note that the naive byte pattern `ff f1 50 80` **looks like an MPEG-1 Layer III frame sync**. It is
not — it is the ADTS syncword, which is why a careless `grep`/sniffer would mislabel this stream as
MP3. This is also exactly why the source's own `type="audio/mpeg"` is wrong (§4.4).

**Not HLS, confirmed three ways:** (a) no `#EXTM3U` / `#EXT-X-` anywhere; (b) the `.m3u8` endpoints
are 36-byte redirect stubs; (c) `transfer-encoding: chunked` with an unbounded body is the signature
of a progressive stream, not a segmented playlist fetch. **There are no `.ts` or `.m4s` segments
anywhere on either host.**

### 4.3 No bitrate ladder, no content negotiation

I sent four different `Accept` headers to the stream. **All four returned identical `audio/aac` @ 128k.**

| Request `Accept` | Result |
|---|---|
| `audio/mpeg` | `200 audio/aac`, `icy-br: 128` |
| `audio/aac` | `200 audio/aac`, `icy-br: 128` |
| `*/*` | `200 audio/aac`, `icy-br: 128` |
| `audio/mpeg,audio/aac,application/octet-stream` | `200 audio/aac`, `icy-br: 128` |

There is **no MP3 fallback, no AAC-LC/HE-AAC ladder, no per-client transcoding, no low-bitrate
variant.** Every listener worldwide receives the identical 128 kbps AAC-LC 44.1 kHz stereo feed.
This is a limitation to design around, not a feature — on a 2G/EDGE connection in the Upper West
Region, 128 kbps stereo AAC is expensive, and MP3 is what those devices actually prefer.

### 4.4 The MIME mismatch (real defect)

The HTML and JS both declare `type="audio/mpeg"`, but the origin returns `content-type: audio/aac`.
What this does in practice:

- The HTML spec lets a UA pre-screen `<source>` elements by `type`. `audio/mpeg` **is** in every
  browser's supported list, so it will not be pre-rejected — the UA will download and content-sniff,
  and the AAC bytes will play. **So this probably works today.**
- But it is a latent trap. If a UA ever tightens pre-screening, or a CDN in front of us ever
  normalises/rewrites the type, the source is skipped and playback fails with
  `MEDIA_ERR_SRC_NOT_SUPPORTED` (code 4).
- It also poisons every downstream tool: server logs, CDN analytics, QoS probes, and player UIs
  will all report an MP3 stream that is not MP3.

**Confidence:** markup and headers are *confirmed*. Actual browser behaviour is *strongly inferred*
— I could not test it (§0).

### 4.5 The fallback logic is dead code (real defect)

`app.js` builds an elaborate multi-source fallback system and then destroys it on the next line:

```js
// Keep the direct source in HTML and add it as a backup for JS diagnostics
radioPlayer.querySelectorAll("source").forEach(src => src.remove());   // ← deletes the HTML source
const source = document.createElement("source");
source.src = streamUrl;                                                 // ← same URL again
source.type = "audio/mpeg";
source.dataset.label = "Direct Zeno stream";
radioPlayer.appendChild(source);                                        // ← exactly ONE source now
```

After this, `sourceElements.length === 1`. Every subsequent line of the fallback machinery is
unreachable:

```js
let sourceIndex = 0;
const sourceElements = radioPlayer.querySelectorAll("source");   // length 1

radioPlayer.addEventListener("error", () => {
  ...
  sourceIndex++;
  if (sourceIndex >= sourceElements.length) {    // 1 >= 1 → true on first error. OK.
    ...
    const widget = document.getElementById("live-audio-bar");
    if (widget) {
      const error = document.createElement("div");
      error.textContent = "Stream temporarily unavailable. Check your browser console (F12) for details.";
      widget.appendChild(error);
    }
  }
}, true);
```

So the real behaviour is: **one error → immediately show a red "Stream temporarily unavailable"
box, and do nothing else.** There is:

- ❌ **no retry** — no reconnect after a transient drop
- ❌ **no backoff**
- ❌ **no second URL** to switch to
- ❌ **no automatic reload** of the `<source>`
- ❌ **no buffering / waiting / stalled state handling** — no `waiting`, `stalled`, or `progress` listeners
- ❌ **no volume persistence**, no "resume where you were"
- ❌ **no unmute-on-second-tab** handling

**Diagnosis (inferred, not confirmed — I never ran this code):** a user who loses connectivity for
five seconds on a Ghanaian mobile network sees a red error box and must manually reload the page.
Given that live radio listeners are typically on mobile data, this is the most likely real-world
failure mode of the whole implementation. The tell-tale sign is the error message itself —
*"Check your browser console (F12) for details"* — which is a developer debugging string shipped
into production user-facing UI.

### 4.6 CORS — verified good

The JS sets `crossorigin="anonymous"` on the player. I verified this is safe by sending an `Origin`
header exactly as a browser would:

```http
HTTP/2 302                          ← Zeno leg
access-control-allow-origin: *

HTTP/1.1 200 OK                     ← CDN leg
content-type: audio/aac
icy-name: Radio Waa 92.1 FM
icy-br: 128
access-control-allow-origin: *
```

`ACAO: *` on both legs. `crossorigin="anonymous"` is safe here. **Note:** with `crossOrigin` set,
the UA enforces CORS on the media fetch, so any future rehosting must preserve `ACAO: *` or
playback breaks with no useful diagnostic. This is worth encoding as a startup assertion.

Also `controlsList="nodownload"` — this only removes the download affordance from the native UI. It
provides **zero** protection against capture. Do not treat it as DRM.

### 4.7 Latency — what I measured, and why you should distrust it

**Measured, with full caveats.** The redirect leg takes seconds from here, and throughput measured
well below real-time:

| Sample | DNS | TCP | TLS | 302 received | First byte | Bytes | Duration |
|---|---|---|---|---|---|---|---|
| 1 | 0.010 s | 0.502 s | 4.560 s | 4.446 s | 7.729 s | 50,202 | 25 s (hit cap) |
| 2 | 0.008 s | 3.605 s | 2.839 s | 3.320 s | 3.320 s | 0 | TLS failure (`unexpected eof`) |
| 3 | 0.009 s | 0.695 s | 3.340 s | 3.355 s | 16.497 s | 33,232 | 25 s (hit cap) |

**I established that these numbers describe my sandbox, not the station.** I benchmarked two
unrelated public CDNs over the same link at the same time:

| Baseline download | Throughput |
|---|---|
| `cdn.jsdelivr.net` (htmx 2.0.4) | 4,962 B/s |
| `unpkg.com` (htmx 2.0.4) | 10,801 B/s |

The test link manages **5–11 kB/s to public CDNs with a 3–4.6 s TLS handshake** — a heavily
constrained mobile path. The stream itself delivered 16.4 kB/s, i.e. *faster* than those baselines
and approximately real-time for 128 kbps (16 kB/s). One connection died mid-handshake.

**So: I cannot characterize Radio Waa's real startup latency.** What I *can* say from
configuration alone:

| Property | Value | Basis |
|---|---|---|
| Nominal bitrate | 128 kbps | `icy-br: 128` — **confirmed** |
| Startup latency | **~2–5 s** — at minimum, the UA must buffer enough frames to decode | **Inferred** from progressive-chunked + AAC-LC |
| Codec algorithmic delay | ~1920 samples ≈ 43 ms at 44.1 kHz (MDCT 2048 window + 1024 overlap) | **Computed** from the frame geometry |
| CDN buffer / jitter buffer | Unknown, CDN-internal | **Unknown** |
| Rebuffer threshold | Unknown, UA-internal | **Unknown** |
| Total listener-side latency | Unknowable without a common-reference capture | **Unknown** |

Rough floor reasoning: a 380-byte frame carries 23.22 ms of audio. To start playback a UA must
have decoded several frames, so **2–5 s of buffered audio** is a realistic minimum, plus the CDN
buffer, plus the network. Progressive chunked delivery is inherently **worse for radio than HLS**
on recovery from packet loss, because there are no independent segments to drop and re-request —
a single lost packet corrupts the frame and stalls the whole decoder.

**To measure this properly:** have someone with a browser open DevTools → Network, filter Media,
record `time to first byte` / first frame presented, then pull the mobile network off for 30 s and
time the recovery. §9.

---

## 5. Schedule / now-playing integration

### 5.1 There is no EPG. None whatsoever.

This is the strongest negative finding in the report. The site has **no schedule data of any kind**,
and no mechanism that could display what is currently on air.

**Confirmed absent, exhaustively:**

| Probe | Result |
|---|---|
| `/shows`, `/shows.html`, `/schedule/` | **404** |
| `/epg/`, `/on-air/`, `/nowplaying/`, `/live/` | **404** |
| `/api/`, `/api/now-playing/`, `/api/nowplaying/`, `/api/stream/`, `/api/schedule/`, `/api/epg/` | **404** |
| `/live.json`, `/stream.json`, `/static/pwa/stream.json` | **404** |
| `sitemap.xml` route inventory | Only `/`, `/search/`, and 116 `/story/<slug>/` |
| `app.js` contents | **Zero `fetch`/`XMLHttpRequest` calls.** No JSON is ever retrieved. |

**The on-air label is a hardcoded constant:**

```js
audioStatusLabel.textContent = isPlaying ? "Radiowaa 92.1 FM is live" : "Tap to play live stream";
```

The label is derived purely from **local player state** (`paused`, `ended`, `currentTime > 0`). It
is a *playback* indicator, not a *broadcast* indicator. It will confidently say
"Radiowaa 92.1 FM is live" while playing ten seconds of pre-recorded AutoDJ filler or an outage
tone, and it will say "Tap to play" during peak live news. **It carries no schedule information at
all.**

### 5.2 Why there is no now-playing — the stream can't carry it either

Even if the front end wanted it, **the origin is not providing it.** The full response header set is:

```http
icy-name: Radio Waa 92.1 FM
icy-br: 128
```

Compare with a Shoutcast/Icecast response carrying metadata. **`icy-metaint` is absent** — and that is
the header that declares the byte interval at which title/artist metadata is interleaved into the
audio payload. Without it, no ICY title block exists in the byte stream. Also absent:
`icy-genre`, `icy-url`, `icy-pub`, `icy-description`, `icy-metaint`.

I also probed for a server-side metadata API and found none:

| Probe | Result |
|---|---|
| `https://stream.zeno.fm/status-json.xsl` (standard Icecast JSON status) | **404** |
| `https://stream.zeno.fm/status.xsl` | **404** |
| `https://stream.zeno.fm/nc7uemx3z98uv/status` | 302 → audio stream |
| `https://stream-178.surfernetwork.com/nc7uemx3z98uv?meta=1` | 302 |
| `https://stream.zeno.fm/nc7uemx3z98uv?type=json` | 302 |

**Conclusion (confirmed):** there is no channel from the broadcaster's playout system to the web
client. Nothing about what is on air ever leaves the station.

### 5.3 Off-air / AutoDJ behaviour — unknown

If the studio goes off-air, SurferNetwork will serve *something* on that connection — silence, a
station ID loop, or an AutoDJ bed. SurferNetwork does offer AutoDJ as a product feature, and `rttl: 5`
in the token is a classic Icecast/SHOUTcast "reload the source after 5 minutes of no data"
directive. **But I did not observe an off-air period and cannot state what happens.** This is an
open question (§9).

### 5.4 Implication for our rebuild

We get **no** schedule or now-playing data from the broadcaster's feed. If we want an on-air widget
— which is a core expectation for a radio website — we must create it ourselves. Options, in
descending order of effort:

1. **Author a weekly schedule ourselves** (CMS data), and compute "now playing" purely on the client
   by intersecting the current UTC/Africa/Accra time with the timetable. Requires no broadcaster
   cooperation. Weakness: silently goes stale when the station deviates (breaking news, sports
   run-overs, election coverage).
2. **Ask Zeno/SurferNetwork to enable ICY metadata + `icy-metaint`**, or to expose their
   now-playing API. Then parse it server-side and expose a JSON endpoint. **Best long-term answer.**
   This requires a commercial conversation, not a code change.
3. **Server-side ICY title parsing** — only viable if (2) lands. Would need a Node proxy that
   strips the interleaved title blocks, since no browser can read ICY metadata natively.

**Design rule:** do **not** ship a client that infers "on air" from `audio.paused`. Model it as
`schedule says X` (our data) separately from `player is playing` (client state), and never conflate
them. That conflation is the current site's mistake and we should not inherit it.

---

## 6. JS bundle analysis

### 6.1 Which bundle owns the player

**One file: `/static/js/app.js`, 6,804 bytes raw / 2,283 bytes gzipped.** No bundler, no chunks, no
dynamic import, no source map, no minification (it is fully readable, with comments and blank lines).

The player logic lives entirely inside a single `DOMContentLoaded` handler, in this order:

| Block | Lines (approx) | Purpose |
|---|---|---|
| `beforeinstallprompt` / `installPWA` | 1–18 | PWA install banner |
| `navigator.serviceWorker.register` | 20–22 | SW registration (**duplicated** at 53–55) |
| `window.testStreamUrl` | 24–51 | Console-only stream diagnostic using a detached `new Audio()` |
| `DOMContentLoaded` → nav toggle | 57–64 | Mobile nav |
| `DOMContentLoaded` → player init | 66–end | The entire player |

### 6.2 What the player code actually does — complete inventory

Every audio-related line, exhaustively:

```js
const radioPlayer = document.getElementById("radio-player");
if (radioPlayer) {
  radioPlayer.setAttribute("crossorigin", "anonymous");

  const streamUrl = "https://stream.zeno.fm/nc7uemx3z98uv";      // ← the URL, hardcoded

  radioPlayer.querySelectorAll("source").forEach(src => src.remove());
  const source = document.createElement("source");
  source.src = streamUrl;
  source.type = "audio/mpeg";                                    // ← wrong MIME
  source.dataset.label = "Direct Zeno stream";
  radioPlayer.appendChild(source);

  radioPlayer.setAttribute("controls", "controls");
  radioPlayer.setAttribute("preload", "metadata");
  radioPlayer.setAttribute("playsinline", "true");
  // … dead multi-source fallback (§4.5) …
  ["canplay","canplaythrough","playing"].forEach(…updateAudioWidget);
  radioPlayer.addEventListener("play"  , …updateAudioWidget);
  radioPlayer.addEventListener("pause" , …updateAudioWidget);
  radioPlayer.addEventListener("ended" , …updateAudioWidget);
  radioPlayer.addEventListener("loadstart", …console.log);

  const updateAudioWidget = () => { … toggle textContent + label … };
  audioStatusToggle.addEventListener("click", () => { paused ? play() : pause(); updateAudioWidget(); });
  updateAudioWidget();
}
```

**Capabilities present:** play/pause via a custom toggle button, status-label text, a
console-only diagnostic helper, a user-facing failure banner.

**Capabilities absent — no library or Web Audio involvement of any kind:**

| Missing | Evidence |
|---|---|
| `hls.js` / any HLS client | Not in `<script src>` list; not in `app.js` |
| `MediaSource` / `SourceBuffer` | Zero occurrences in `app.js` |
| `AudioContext` / `AnalyserNode` (Web Audio) | Zero occurrences — only `new Audio()`, which is the HTMLMediaElement constructor, not Web Audio |
| `Howler` / `jPlayer` / `Plyr` / `MediaElement` / `RadioJS` / `SoundManager` | Zero occurrences; not in any `<script src>` |
| Bitrate/codec negotiation | No `canPlayType` calls anywhere |
| Reconnect / retry / backoff | No `setTimeout`, no retry loop (§4.5) |
| Volume persistence / media-session | No `navigator.mediaSession` — no lock-screen or headphone-button control |
| Analytics / error reporting | `console.*` only; nothing sent anywhere |

I grepped the served HTML for all of `m3u8`, `icecast`, `shoutcast`, `;listen`, `;stream`,
`MediaSource`, `AudioContext`, `hls`, `howler`, `jplayer`, `plyr`, `mediaelement`, `soundmanager`,
`bitrate` — **the only hits across all pages were `<source src="https://stream.zeno.fm/…">` and the
substring `stream.` in unrelated copy.** There is not a second stream reference anywhere.

### 6.3 Code-quality observations

1. **Duplicated service-worker registration** — the identical `navigator.serviceWorker.register("/static/pwa/sw.js")` block appears at lines ~20 and ~53.
2. **`updateAudioWidget` is a `const` referenced before its declaration.** It is captured by
   `canplay`/`play`/`pause` handlers registered *above* its declaration. This is safe in practice
   only because those are async event handlers and TDZ expires before they fire. A future
   synchronous call site would throw a `ReferenceError`.
3. **`error` listener uses capture (`}, true)`).** Deliberate and correct: `error` events on
   `<source>` elements do not bubble, so capture is the only way to observe them.
4. **`error` handler on the parent `<audio>` fires for both network and decode errors**, and the
   handler indexes `sourceElements[sourceIndex]` — which, after the deletion above, is always the
   one real source.
5. **User-facing text instructs users to open F12.** Debug string in production UI.
6. **No `playsinline` in the HTML** — set imperatively by JS. Minor; it's there, just late.

---

## 7. PWA / offline behaviour

### 7.1 The manifest — audio-relevant content: **none**

Fetched at `/static/pwa/manifest.json` (239 bytes raw; the brief's `wa-manifest.json` is 404):

```json
{
    "name": "Radiowaa 92.1 FM",
    "short_name": "RW 92.1",
    "description": "Live news, stories, and entertainment from Upper West Region, Ghana",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#dc2626",
    "orientation": "portrait-primary",
    "scope": "/",
    "icons": [ …4 entries: 192/512, `any` + `maskable`… ],
    "screenshots": [ {540×720 narrow}, {1280×720 wide} ]
}
```

**Specifically checked and absent:**

| Feature | Present? |
|---|---|
| `shortcuts` (e.g. "Play live") | ❌ no |
| `categories` (`music`, `radio`) | ❌ no |
| `prefer_related_applications` / Any-URL protocol handler | ❌ no |
| `display_override` / `share_target` / `protocol_handlers` | ❌ no |
| Any audio-related key | ❌ none — the manifest spec has no audio key anyway |

Icons and screenshots are declared but I did not fetch the binaries; I did not verify they exist
(§9).

### 7.2 The service worker (902 bytes, complete)

```js
const CACHE_NAME = "radiowaa-v1";
const SHELL_URLS = ["/", "/static/css/style.css", "/static/js/app.js"];

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    if (e.request.method !== "GET") return;
    e.respondWith(
        fetch(e.request)
            .then((res) => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                return res;
            })
            .catch(() => caches.match(e.request))
    );
});
```

**Audio-relevant answers, all confirmed by reading the file:**

| Capability | Present? |
|---|---|
| `Background Sync` (`sync` event) | ❌ **no** |
| `Periodic Background Sync` | ❌ **no** |
| `Push` / `Notification` handlers | ❌ **no** |
| Notification permission request | ❌ no |
| Media Session API | ❌ no (this is `app.js`, not SW) |
| Any stream-specific SW logic | ❌ no |
| `range` header handling | ❌ **no — and this matters** |
| Cache-first for audio | ❌ no; audio falls into the generic branch |

### 7.3 The SW will interfere with live audio — concrete defects

1. **It tries to cache the infinite audio stream.** The `fetch` handler matches **every** GET with
   no allowlist and no exception for the stream host. On each successful media response it calls
   `cache.put(e.request, clone)` on a `text/event-stream`-like, never-ending, `chunked` response.
2. **The `cache.put` promise is not awaited and not caught.** It is fire-and-forget inside `.then()`.
   For a cross-origin request, `cache.put` rejects with `SecurityError` ("Request scheme 'cors' is
   not supported") — because the stream is on `stream.zeno.fm`, a different origin from
   `myradiowaa.com`. That becomes an **unhandled promise rejection**, invisible to the user.
3. **It clones every response**, doubling memory for a stream that is meant to be infinite.
4. **No `Range` request handling.** If the browser ever issues a range request (it does, on seek,
   and some UAs on reconnect), it gets cached verbatim. A cached 206 partial response served to a
   later full request will corrupt playback.
5. **`CACHE_NAME` is pinned at `radiowaa-v1` and never rotated** — stale HTML/JS is served until the
   cache name is manually bumped.
6. **The catch-all `.catch(() => caches.match(e.request))`** means that if the network is down, a
   stale *shell* page is served — and the user then presses play on a stream that is equally
   unreachable, producing the red error box from §4.5 rather than an offline page.

**Net effect (inferred):** the SW provides no offline audio capability at all — a live stream cannot
be meaningfully cached — while adding a class of bugs and console noise. **Our rebuild should not
register a service worker for the live player path at all**, or must explicitly bypass it for
cross-origin media.

---

## 8. Recommendations for our Radio Waa live-audio backend

Framed for **Next.js 16** (App Router, React Server Components, Route Handlers, deployed to a Node
runtime — note the current project is Next.js 16.4.0 per `radio-waa-server.log`).

### 8.1 Protocol recommendation

**Keep progressive AAC as the primary path. Add HLS as an optional enhancement only if the
broadcaster can supply it. Do not build a transcoding layer.**

Reasoning:

- **Progressive chunked is correct for live radio, not a shortcut.** For a single 128 kbps audio
  stream, HLS's segmenting buys you almost nothing: no ABR ladder to select between (there's one
  rendition), and progressive's "one lost packet stalls the decoder" weakness is largely mitigated
  by TCP retransmission for the tiny, low-bandwidth case. HLS's real advantage is *CDN-cacheable
  segments*, and for licensed-live-radio that is often contractually *disallowed* anyway (§8.7).
- **The station already emits exactly one format.** We have no negotiation to do.
- **AAC-LC is the right modern choice** and is universally supported by browsers, iOS, Android,
  and every smart speaker.

**Concrete choice:**

| Concern | Decision |
|---|---|
| Protocol | Progressive AAC-LC, `audio/aac` |
| Source of truth | The **stable Zeno URL** `https://stream.zeno.fm/nc7uemx3z98uv` — never the CDN URL |
| MIME declaration | `audio/aac` (**fix the current site's `audio/mpeg` bug**) |
| Target bitrate | 128 kbps stereo 44.1 kHz — matches the feed; re-encode only if we add MP3 |
| HLS | Only if/when the broadcaster provides it. Do not synthesise it from a progressive source. |
| MP3 fallback | Only if the broadcaster adds it. See §8.3 for the "if you must" option. |

### 8.2 The critical architectural point: do NOT hardcode the CDN URL

The Zeno URL is a **token issuer**, and its CDN redirect carries a **60-second HS256 JWT** with
`cache-control: no-cache`. Three rules follow, and violating any of them produces a player that
works in dev and dies in production:

1. **Never cache the resolved CDN URL** — not in `next.config`, not in a `const`, not in the
   database, not in a CDN edge cache, not in a long-lived Route Handler response.
2. **Never `fetch()` the audio server-side and re-pipe it.** That would make our Node process a
   permanent 128 kbps relay per listener. Do not proxy the media bytes.
3. **Point the browser at the stable Zeno URL directly.** The browser follows the 302 itself, in
   milliseconds, with a fresh token. This is what the current site does, and it is correct.

**Do not cache-bust this URL ourselves** (adding `?_=<Date.now()()` is unnecessary — the 302 is
already uncached and already issues a fresh token).

### 8.3 What to build server-side

**A metadata/config endpoint, not a media proxy.**

```ts
// app/api/stream/route.ts
import { NextResponse } from "next/server";

// Live radio streams must never be cached: the upstream issues a short-lived signed token.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      station: "Radio Waa 92.1 FM",
      streamUrl: process.env.RADIO_WAA_STREAM_URL!, // https://stream.zeno.fm/nc7uemx3z98uv
      mimeType: "audio/aac",
      codec: "aac-lc",
      bitrateKbps: 128,
      sampleRateHz: 44100,
      channels: 2,
      // Deliberately null until the station supplies ICY metadata or an EPG feed (§5).
      nowPlaying: null,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
```

**Environment variable**, never a hardcoded literal — this makes the upstream swappable (Zeno →
SurferNetwork → self-hosted Icecast) without a code change:

```bash
# .env.example
RADIO_WAA_STREAM_URL=https://stream.zeno.fm/nc7uemx3z98uv
```

**Deliberately NOT building:**

| Not building | Why |
|---|---|
| A server-side audio proxy | Per-listener bandwidth cost, buffering, timeout hell, and pointless CPU. Let the CDN do it. |
| A server-side HLS packager (e.g. `ffmpeg -f hls`) | Adds latency, failure modes, licensing surface, and a per-listener CPU bill, to solve a problem the feed doesn't have. |
| A stored CDN URL | Expires in 60 s (§3.1). |
| ICY title parsing | Impossible today — no `icy-metaint` on the feed (§5.2). Revisit only if the station enables it. |
| A per-listener re-encode | One format, universally supported. |

### 8.4 What the client player should do

Current site uses the native element with ~120 lines of hand-written glue. Keep the native element
— it is the correct, dependency-free, most-compatible choice — but fix the four real defects.

**Minimum requirements:**

```tsx
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "connecting" | "playing" | "buffering" | "error";

export function LivePlayer({ streamUrl, mimeType = "audio/aac" }: {
  streamUrl: string;
  mimeType?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showDebug, setShowDebug] = useState(false);
  const attempts = useRef(0);

  // (a) RECOVERY — the biggest gap in the current site (§4.5).
  // Listen for `stalled`/`waiting`, then reload the media element after a backoff.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onStall = () => {
      setPhase("buffering");
      const delay = Math.min(1000 * 2 ** attempts.current++, 30000); // 1s→2s→4s… cap 30s
      window.setTimeout(() => {
        // Re-assigning src restarts the fetch and forces a fresh token from Zeno.
        el.src = streamUrl;
        el.load();
        void el.play().catch(() => {});
      }, delay);
    };
    const onPlaying = () => { attempts.current = 0; setPhase("playing"); };
    const onError = () => { if (el.error) onStall(); };

    el.addEventListener("waiting", onStall);
    el.addEventListener("stalled", onStall);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("waiting", onStall);
      el.removeEventListener("stalled", onStall);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("error", onError);
    };
  }, [streamUrl]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) { setPhase("connecting"); void el.play().catch(() => setPhase("error")); }
    else el.pause();
  }, []);

  return (
    <div>
      <audio
        ref={audioRef}
        controls
        playsInline
        preload="none"        // (b) don't touch the network until the user asks
        src={streamUrl}
        // (c) correct MIME — fixes the current site's audio/mpeg bug
        // (no `type` attr needed when using `src`; it is only honoured on <source>)
      />
      <button onClick={toggle}>{phase === "playing" ? "Pause" : "Play"}</button>
      {/* (d) user-facing states, not console instructions */}
      <p aria-live="polite">{STATUS_COPY[phase]}</p>
    </div>
  );
}
```

**The four fixes, and why each matters:**

| # | Fix | Rationale |
|---|---|---|
| a | **Stall recovery with capped exponential backoff** (`waiting`/`stalled` → `load()` + `play()`) | The current site shows a red box and gives up. On mobile data this is the #1 failure mode. Re-assigning `src` also re-triggers the 302 and gets a fresh 60 s token. |
| b | **`preload="none"`** | `preload="metadata"` on an infinite chunked stream still opens a connection for every pageview — real money on cellular, for zero benefit. Wait for the user. |
| c | **`audio/aac`, and use `src` not `<source>`** | Avoids the MIME pre-screening trap (§4.4) entirely. With `src`, the `type` attribute doesn't exist and the UA sniffs content. |
| d | **Real UI states** (`connecting` / `buffering` / `error` + retry) | Never tell users to open F12. Show a human sentence and a Retry button. |

**Strongly consider adding** (none of which the current site has):

- **Media Session API** — `navigator.mediaSession.metadata` + action handlers. This is what makes
  play/pause work from the lock screen, the notification shade, and headphone buttons on Android.
  For a radio app this is close to table stakes and costs ~30 lines.
- **Volume persistence** via `localStorage`, restored on user gesture (autoplay policy blocks
  programmatic volume+play).
- **Persistent player across navigation.** The current site's biggest genuine UX strength is that
  the fixed widget keeps playing while you browse. In Next.js App Router, a floating player must
  live in a **layout** so it survives client-side route changes — put it in a client component in
  your root layout, not in a page.
- **`aria-live` status region** for the buffering/error state.

**Do NOT add** a player library (Howler/Plyr/MediaElement) unless you need Web Audio
visualisation. If you do want a volume indicator, Web Audio needs CORS-clean media *plus* a
`crossOrigin="anonymous"` tag, and you must keep in mind that the browser then buffers in
`ArrayBuffer`s — pointless for a 128 kbps stream. Custom skinning, if wanted, is better done by
hiding the native `controls` and driving the element yourself.

### 8.5 Fallback strategy

Today's fallback is one hardcoded URL with a dead-code loop. Design it properly:

| Layer | Strategy |
|---|---|
| **Transport** | Stream URL comes from `RADIO_WAA_STREAM_URL` env var, read per request — never a build-time constant. Swap providers without a deploy. |
| **Redirect** | The browser follows Zeno's 302. Do not pre-resolve or cache it. |
| **Recovery** | Capped exponential backoff (1s→30s), unbounded attempts, `load()` on every retry so a fresh token is fetched. Reset the counter on `playing`. |
| **Stall detection** | `waiting` + `stalled` + `error` (capture phase if you keep `<source>`). Also a watchdog: if `!paused && readyState < 3` for >15 s, force a reload. |
| **Second source** | Add only if the station gives us a genuinely independent one (e.g. their own Icecast alongside Zeno). Do **not** point fallback #2 at the CDN URL — it needs a token. |
| **Offline** | Detect `navigator.onLine`; show "You're offline — live radio needs a connection." Don't attempt playback. |
| **User control** | Always offer a manual Retry button. Never auto-hide the player on error. |

### 8.6 Observability

The current site logs to `console` and ships nothing anywhere. Since live-radio failures are
invisible without instrumentation, add:

- **Server-side**: a scheduled uptime probe (every 60 s) that issues a short ranged `GET` to the
  stream URL, asserts `200` + `content-type: audio/aac` + `icy-br`, and records latency and bytes
  received. Alert if the probe fails N times consecutively. This catches "the station's encoder
  died" *before* users report it. **Keep the probe cheap** — 2–3 s per run, then abort the transfer.
- **Client-side**: report `MediaError.code` (1 aborted / 2 network / 3 decode / 4 unsupported),
  `networkState`, `readyState`, the resolved URL, and the elapsed time to first `playing` event.
- **Assert CORS at boot** (§4.6): if a future rehost drops `ACAO: *`, `crossorigin` fails with a
  useless `MEDIA_ERR_NETWORK`. A boot-time `fetch(url, {method:'HEAD', mode:'cors'})` check turns
  that into a clear diagnostic.
- **Track time-to-first-audio-byte** in the real world. §4.7 could not measure it; you can.
- **Never ship a "check the console" string to users.** Log to telemetry, show a human sentence.

### 8.7 Licensing, compliance, and contract — read this before launch

This is the highest-risk area and the one I could least determine from outside.

1. **Get the streaming contract in writing.** Radio Waa streams via **Zeno.fm**, which fronts
   **SurferNetwork** (node 178). That is a **two-party commercial relationship**, and it almost
   certainly contains terms covering: permitted clients, permitted territories, whether
   redistribution or re-publication is allowed, concurrent-connection limits, bandwidth caps,
   and whether the feed may be embedded on third-party domains. **We could not read any of this.**
   Ask the station for the contract or the account manager's contact. *Our rebuild embeds the same
   feed on a new domain (`radiowaa.com`? a Vercel deployment?); some contracts whitelist domains.*
2. **Broadcast licence, not just a streaming licence.** A Ghanaian community FM station operates
   under an FCC/NCA licence with conditions on **coverage area** (the Upper West Region) and
   content. *Streaming a terrestrial broadcast over the public internet is legally distinct from
   broadcasting it* and normally requires its own authorisation (Ghana's NCA, and the MGCSD for
   content). **Get legal advice.** I am not offering a legal opinion — flagging that this is a real
   gate, not a formality.
3. **Performance royalties.** If we add now-playing metadata, published logs, or replay features,
   collecting societies (Ghana's **MUSIG** / **Copyleft**; PROs generally) may have claims against
   broadcast data. Verify obligations before shipping analytics or a track-history feature.
4. **Terms of the Zeno JWT.** The 60-second signed token means the operator intends *tight* control
   over who may consume and how. Do not attempt to circumvent it (no token harvesting, no
   CDN-URL caching, no attempt to bypass per-request signing). Use the published stable URL, which
   is what it is for.
5. **Geographic restrictions.** Probed from Ghana with an anonymous client. A stream restricted to
   Ghana would work for us and **fail for users abroad** — a very common failure for Ghanaian
   stations, and one we would not detect. **Test from outside Ghana** (§9).
6. **DMCA / takedown.** Broadcasting to a public web audience means exposure to takedown and
   injunctions. Have a takedown contact and a process.
7. **`controlsList="nodownload"`** is not DRM and not a licence control. Do not rely on it.
8. **Privacy.** Do not log IP addresses of listeners without a lawful basis and a published
   notice. Note that our own uptime probe (§8.6) is a server-side request from our infrastructure,
   which is different from collecting listener IPs — keep the two separate.

### 8.8 Summary of defects to fix vs. copy

| Aspect | Current site | Our recommendation |
|---|---|---|
| Player library | none (good) | none (keep) |
| Protocol | progressive AAC (fine) | progressive AAC (keep) |
| MIME declared | `audio/mpeg` ❌ | `audio/aac` ✅ |
| `preload` | `metadata` ⚠️ | `none` ✅ |
| Recovery | none ❌ | backoff + `load()` ✅ |
| Stream URL | hardcoded in JS ⚠️ | env var, read per request ✅ |
| CDN URL cached | no (correct) | never — 60 s TTL ✅ |
| Server media proxy | none (correct) | none (keep) ✅ |
| Now-playing | hardcoded string ❌ | real EPG we author, or ICY once enabled ✅ |
| Service worker on media | caches the stream ❌ | bypass SW for cross-origin media ✅ |
| Media Session | none ❌ | implement ✅ |
| PERSIST across navigation | yes (fixed widget) ✅ | keep — put player in root layout ✅ |
| User-facing error text | "check F12" ❌ | human sentence + Retry ✅ |
| Monitoring | none ❌ | server probe + client telemetry ✅ |
| `DEBUG=True` in prod ❌ | — | ensure ours is off |

---

## 9. What we could not determine

Everything below is genuinely open. For each, I give the cheapest way to answer it.

| # | Open question | Why it's open | How to answer it |
|---|---|---|---|
| 1 | **Does playback actually work in a real browser?** | No browser on this host. I read markup and bytes, never rendered. | Open myradiowaa.com in Chrome, press play, confirm audio. |
| 2 | **Real startup latency (time-to-first-audio-byte)** | §4.7 measurements are link-limited — my sandbox link does only 5–11 kB/s to public CDNs with a 3–4.6 s TLS handshake. | DevTools → Network → Media → filter the stream → read time-to-first-byte and first frame presented. Repeat on 4G and on Wi-Fi. |
| 3 | **Rebuffer behaviour and recovery time** | Never observed a runtime drop. | Start playback, disable the network for 30 s, re-enable, time the recovery. The current site has no recovery path — confirm. |
| 4 | **What happens when the station is off-air?** | Only sampled on-air. Unknown whether AutoDJ, silence, an ID loop, or a dead connection. | Listen at 03:00 local, or ask the station directly. Also worth asking whether they run AutoDJ at all. |
| 5 | **Now-playing / ICY metadata — available on request?** | No `icy-metaint`, no `icy-genre`/`icy-url`, no status API. It may simply be disabled. | Ask Zeno.fm/SurferNetwork to enable ICY metadata or expose a now-playing API. Highest-value ask in the whole report. |
| 6 | **Geographic restrictions** | Probed only from Ghana. | Test the stream from Europe/US/VPN. |
| 7 | **Concurrent-connection limits / bandwidth caps** | Contractual, not technical. | Ask Zeno.fm / SurferNetwork for the account's terms. |
| 8 | **Does the contract permit embedding on our domain?** | Contractual. | Ask. Our rebuild embeds the same feed from a different origin. |
| 9 | **Is the feed encrypted (ICE/SRT/DASH-AES)?** | Served as plain HTTP chunked AAC with `ACAO: *`. **Almost certainly not encrypted** — a browser cannot decrypt ICEcast without a plugin — but not confirmed against a managed-encoder console. | Confirm with SurferNetwork's dashboard. |
| 10 | **Codec variants available upstream** | Only one rendition is served; all `Accept` headers return the same AAC. May exist but be unexposed. | Ask SurferNetwork whether MP3 or HE-AAC renditions exist and are merely not advertised. |
| 11 | **Does `type="audio/mpeg"` actually break any browser?** | §4.4 is reasoning, not observation. | Test Chrome, Firefox, Safari, and Android WebView against the live page. Watch for `MEDIA_ERR_SRC_NOT_SUPPORTED`. |
| 12 | **Exact upstream topology — is there a self-hosted Icecast?** | The chain is opaque behind SurferNetwork. `rttl: 5` suggests Icecast/SHOUTcast lineage somewhere. | Ask Zeno.fm; or ask the station whether it self-hosts. |
| 13 | **Django DEBUG page exposure — scope of leak** | I confirmed `DEBUG = True` (§4.7) from the URLconf name `radiowaa.urls` and `Phusion Passenger(R) 6.2.0` on the header. I did **not** try to trigger a traceback (which would expose local file paths, settings module, and DB config) — that would be inappropriate without authorisation. | **Do not test this without authorisation.** Report it to the station privately. Raising it as a finding is appropriate; exploiting it is not. |
| 14 | **Django URL patterns beyond `/`, `/search/`, `/story/<slug>/`** | The technical 404 lists the patterns it *tried*, not the full URLconf. | `sitemap.xml` is already a complete inventory (118 URLs), so this is likely fully answered. For anything beyond it, ask the station directly — **do not** harvest the URLconf from the DEBUG page. |
| 15 | **Whether the four manifest icons and two screenshots exist** | Declared but not fetched. | `HEAD` each: `/static/pwa/icon-192.png`, `icon-192-maskable.png`, `icon-512.png`, `icon-512-maskable.png`, `screenshot-540.png`, `screenshot-1280.png`. |
| 16 | **Real traffic volume / concurrent listeners** | No analytics on the site, no access to Zeno's dashboard. | Ask Zeno.fm for the listener statistics on the account. |
| 17 | **Browser/OS support matrix** | No browser testing possible. | Real-device testing (§9.1, §9.11). |

### Reproducing this analysis

Everything in this report is reproducible from an Android/Termux shell:

```bash
UA="Mozilla/5.0 (Linux; Android 13)"

# 1. Find the stream in the markup
curl -sS -A "$UA" --compressed https://myradiowaa.com/ | grep -oE '<audio.*</audio>'

# 2. Read the full response headers (follow the 302)
curl -sS -D - -o /dev/null -L -H "Origin: https://myradiowaa.com" \
  -H "Range: bytes=0-1000" https://stream.zeno.fm/nc7uemx3z98uv

# 3. Decode the codec from the bytes
curl -sS -L -A "$UA" -o s.bin --max-time 8 https://stream.zeno.fm/nc7uemx3z98uv
python3 -c "
d=open('s.bin','rb').read(); print(d[:16].hex(' '))
print('ADTS' if d[:1]==b'\xff' and d[1]&0xF0==0xF0 else 'not ADTS')"

# 4. Decode the redirect token
curl -sS -D - -o /dev/null -A "$UA" https://stream.zeno.fm/nc7uemx3z98uv \
  | grep -i '^location:'

# 5. Confirm no EPG exists
for p in api/now-playing/ api/epg/ live/ schedule/ shows/ epg/; do
  curl -sS -o /dev/null -w "$p %{http_code}\n" -A "$UA" --compressed "https://myradiowaa.com/$p"
done
```

**Artifacts saved during this analysis** (in `/data/data/com.termux/files/usr/tmp/opencode/`):
`home-live.html`, `wa-salvage/` (index, story, search, sitemap, app.js, sw.js, style.css,
manifest.json), `wa-js/` (REA-indexed JS directory, evidence `ev_4c4ccafeb1887463e08d293888b7c4ada5062751df6657feae8eeaddbd67551e`),
`stream-sample.bin`, `samp1.bin`, `samp3.bin`, `stream-headers.txt`, `m3u8-headers.txt`,
`playlist.m3u8`.