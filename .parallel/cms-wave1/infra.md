# Infra report — Postgres + environment hardening (radio-waa)

Agent scope: `.env`, `.env.example`, `scripts/**`, `AGENTS.md`, Postgres process/DB
operations. Nothing under `src/**`, `next.config.mjs`, or `package.json` was touched.

## 1. `scripts/pg.sh` — lifecycle manager

`scripts/pg.sh` (executable, `bash -n` clean, shebang
`#!/data/data/com.termux/files/usr/bin/env bash`).

Subcommands:

| Command | Behavior | Exit codes |
|---|---|---|
| `start` | Idempotent. `pg_ctl status` says running → prints "already running" and returns (after confirming readiness). Otherwise launches `pg_ctl start` detached via the host pattern `setsid nohup ... > ctl.log 2>&1 </dev/null & disown`, then polls until ready. | 0 ok; 1 start/ready failure |
| `stop` | Idempotent. `pg_ctl -m fast stop` when running; "not running" + 0 otherwise. | 0 |
| `status` | One line: `pg: running (pid N, 127.0.0.1:5432, datadir …)` or `pg: not running`. | 0 running / 3 not running |
| `restart` | stop (if running) then start. | 0 / 1 |
| `ready` | Polls `pg_isready -h 127.0.0.1 -p 5432 -U postgres -d radiowaa` **and** `psql -c 'select 1'` every 1 s up to `PG_READY_TIMEOUT` (default 30 s). DB-level check, so "ready" means Payload's exact connection works. | 0 ready / 1 not running or timeout |
| `psql` | `psql` against `radiowaa`, extra args passed through (`scripts/pg.sh psql -c "…"`). | psql's |
| `logs` | `tail -n 50` of the server log; `logs -f` follows. | 0 / 1 no log |

Safety/design points:

- **No `pgrep -f` / `pkill -f` anywhere** (they match the invoking shell on this
  host and kill the session). Liveness comes from `pg_ctl status` reading
  `postmaster.pid`.
- **Detached** so the Android reaper doesn't take Postgres down with the calling
  shell: `setsid nohup pg_ctl … & disown`.
- **Logs** at `/data/data/com.termux/files/usr/tmp/opencode/postgres.log`
  (pg_ctl's own log at `…/opencode/pg-ctl.log`) — never `/tmp` (read-only here).
- Env overrides supported: `PGDATA`, `PGPORT`, `PGHOST`, `PGUSER`, `PGDATABASE`,
  `PG_READY_TIMEOUT`, `PG_LOG_DIR`, `PG_LOG_FILE`.
- `pg_isready` is passed `-U postgres -d radiowaa` so readiness pings don't spam
  the server log with `FATAL: role "<os-user>" does not exist`.

## 2. Postgres tuning (persisted in `pgdata/postgresql.conf`)

Sized for ~7.9 GB RAM total / ~2.5 GB available, one small CMS database next to
the Next.js dev server (which itself wants ~1–1.5 GB). All values persisted in
the config file — the postmaster now runs as plain `postgres -D
/data/data/com.termux/files/home/pgdata` with **no `-c` overrides**.

| Setting | Old (default) | New | Rationale |
|---|---|---|---|
| `shared_buffers` | 128MB | **128MB** (kept, now explicit in a tuning block) | ~5% of available RAM; Postgres leans on the OS page cache for the rest. Growing it would steal from Node. |
| `work_mem` | 4MB (default, commented) | **4MB** | Per sort/hash operation and *per connection*, and complex queries can use several. Small queries on a CMS DB don't need more; with 20 connections the worst case stays bounded. |
| `maintenance_work_mem` | 64MB | **32MB** | Halved. VACUUM / CREATE INDEX on a CMS-sized DB is tiny; 64MB of transient build memory is wasted here. |
| `max_connections` | 100 | **20** | The single best memory lever: idle backends each cost several MB plus a work_mem allowance. One pooled Payload/Next process + a few psql sessions fit easily. |
| `effective_cache_size` | 4GB | **512MB** | Planner hint only (no allocation). 4GB told the planner the OS cache is huge; 512MB is an honest estimate of what's actually free for page cache beside Node. |
| `listen_addresses` | `'localhost'` (default, was passed via `-c`) | **`'127.0.0.1'`** | Persisted; explicit IPv4 loopback only. |
| `port` | 5432 (default, was passed via `-c`) | **5432** | Persisted so `pg_ctl start` needs no flags. |

Proof (from `scripts/pg.sh psql -Atc "show …"` after a script-driven restart):

```
shared_buffers       128MB
work_mem             4MB
maintenance_work_mem 32MB
max_connections      20
effective_cache_size 512MB
listen_addresses     127.0.0.1
port                 5432
```

Postmaster command line observed:

```
31505 /data/data/com.termux/files/usr/bin/postgres -D /data/data/com.termux/files/home/pgdata
```

(no `-c` flags → values come from the persisted config).

## 3. Environment files

- **`.env`** (new; already covered by the repo's `.gitignore` rules `.env` /
  `.env.*` with `!.env.example`). Did not previously exist, so nothing to merge.
  Keys created:
  - `DATABASE_URL=postgres://postgres@127.0.0.1:5432/radiowaa`
  - `PAYLOAD_SECRET=<64 hex chars>` — fresh from
    `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - `CONTENT_SOURCE=local`
- **`.env.example`** (tracked): all three existing keys kept
  (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_STREAM_URL` —
  stream still intentionally empty). `DATABASE_URL` placeholder replaced: the
  old `radio:radio@localhost` user does not exist on this machine; it now reads
  `postgres://postgres@127.0.0.1:5432/radiowaa` (trust auth, no password, real
  local shape). Added `PAYLOAD_SECRET=replace-with-64-hex-chars` and
  `CONTENT_SOURCE=local`, each key with a one-line comment. No real secret in
  the example.

## 4. `AGENTS.md`

Appended **section 6 "Database (Postgres 18, native Termux)"** only; existing
sections untouched. Documents: bring-up via `scripts/pg.sh start` (waits until
ready) and the `scripts/pg.sh ready` exit-code gate, that Android reaps the
process between sessions, the data dir, loopback+trust auth ("never exposed"),
the no-`pgrep -f` rule, the log path, the tuning table with rationale, and that
this supersedes the older "no database" / "unused" notes in §4–§5. States `start`
is idempotent; `ready` is the dependency gate for other scripts.

## 5. Observed stop → start → status → ready cycle (verbatim)

Command: `scripts/pg.sh stop`, then `status`, `start`, `status`, `ready`,
`start` (idempotency re-run).

```
$ scripts/pg.sh stop
waiting for server to shut down.... done
server stopped
pg: stopped
exit=0

$ scripts/pg.sh status
pg: not running
exit=3

$ scripts/pg.sh start
pg: started (pid 31505, 127.0.0.1:5432, log /data/data/com.termux/files/usr/tmp/opencode/postgres.log)
exit=0

$ scripts/pg.sh status
pg: running (pid 31505, 127.0.0.1:5432, datadir /data/data/com.termux/files/home/pgdata)
exit=0

$ scripts/pg.sh ready
pg: ready (127.0.0.1:5432/radiowaa)
exit=0

$ scripts/pg.sh start   # idempotent re-run
pg: already running (pid 31505, 127.0.0.1:5432)
exit=0
```

Also verified: `ready` while down prints `pg: not running — use scripts/pg.sh
start` and exits 1; `restart`, `psql`, `logs`, and `status` exit-3 have all been
exercised. Post-restart server log is clean (listening on 127.0.0.1:5432, "ready
to accept connections", no FATALs). Final state: **Postgres running**, DB
`radiowaa` reachable.
