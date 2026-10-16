#!/data/data/com.termux/files/usr/bin/env bash
# pg.sh — Postgres lifecycle manager for radio-waa (Android/Termux).
#
# Android reaps background processes, so Postgres does not survive between
# sessions and there is no systemd. `scripts/pg.sh start` is the idempotent way
# to bring it back; `scripts/pg.sh ready` is the exit-code gate for other
# scripts (0 = accepting connections, non-zero = timeout / not running).
#
# Never use pgrep/pkill -f here: the pattern matches the invoking shell itself
# and kills your own session. pg_ctl status/stop use postmaster.pid instead.

set -eu

PGDATA="${PGDATA:-/data/data/com.termux/files/home/pgdata}"
# Never /tmp — it is a read-only filesystem on this device.
LOGDIR="${PG_LOG_DIR:-/data/data/com.termux/files/usr/tmp/opencode}"
LOGFILE="${PG_LOG_FILE:-$LOGDIR/postgres.log}"
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-radiowaa}"
READY_TIMEOUT="${PG_READY_TIMEOUT:-30}"

usage() {
  cat <<'EOF'
usage: scripts/pg.sh <command>

  start    start Postgres if not running (idempotent; waits until ready)
  stop     stop Postgres if running (idempotent)
  status   one-line status; exit 0 if running, 3 if not
  restart  stop then start
  ready    wait until the server accepts connections to the project DB
           (exit 0 ready, 1 timeout) — safe gate for other scripts
  psql     open psql against the project DB (extra args are passed through)
  logs     print the server log tail (pass -f to follow)
EOF
}

is_running() {
  pg_ctl status -D "$PGDATA" >/dev/null 2>&1
}

server_pid() {
  head -n 1 "$PGDATA/postmaster.pid" 2>/dev/null || true
}

wait_ready() {
  local waited=0
  while [ "$waited" -lt "$READY_TIMEOUT" ]; do
    if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -q 2>/dev/null \
      && psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -Atqc 'select 1' >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done
  return 1
}

cmd_start() {
  if is_running; then
    if wait_ready; then
      echo "pg: already running (pid $(server_pid), $PGHOST:$PGPORT)"
      return 0
    fi
    echo "pg: process running but not accepting connections — see $LOGFILE" >&2
    return 1
  fi
  mkdir -p "$LOGDIR"
  # Detach from the calling shell so the reaper doesn't take Postgres down with
  # the session (host pattern: setsid + nohup + disown).
  setsid nohup pg_ctl -D "$PGDATA" -l "$LOGFILE" -w -t "$READY_TIMEOUT" start \
    >"$LOGDIR/pg-ctl.log" 2>&1 </dev/null &
  disown
  if wait_ready; then
    echo "pg: started (pid $(server_pid), $PGHOST:$PGPORT, log $LOGFILE)"
    return 0
  fi
  echo "pg: failed to start within ${READY_TIMEOUT}s — see $LOGFILE and $LOGDIR/pg-ctl.log" >&2
  return 1
}

cmd_stop() {
  if ! is_running; then
    echo "pg: not running"
    return 0
  fi
  pg_ctl -D "$PGDATA" -m fast stop
  echo "pg: stopped"
}

cmd_status() {
  if is_running; then
    echo "pg: running (pid $(server_pid), $PGHOST:$PGPORT, datadir $PGDATA)"
    return 0
  fi
  echo "pg: not running"
  return 3
}

cmd_ready() {
  if ! is_running; then
    echo "pg: not running — use scripts/pg.sh start" >&2
    return 1
  fi
  if wait_ready; then
    echo "pg: ready ($PGHOST:$PGPORT/$PGDATABASE)"
    return 0
  fi
  echo "pg: not ready after ${READY_TIMEOUT}s" >&2
  return 1
}

cmd_psql() {
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" "$@"
}

cmd_logs() {
  if [ ! -f "$LOGFILE" ]; then
    echo "pg: no log file at $LOGFILE" >&2
    return 1
  fi
  tail -n "${PG_LOG_LINES:-50}" "$@" "$LOGFILE"
}

case "${1:-}" in
  start)   cmd_start ;;
  stop)    cmd_stop ;;
  status)  cmd_status ;;
  restart) cmd_stop && cmd_start ;;
  ready)   cmd_ready ;;
  psql)    shift; cmd_psql "$@" ;;
  logs)    shift; cmd_logs "$@" ;;
  ""|help|-h|--help) usage; [ -n "${1:-}" ] || exit 2 ;;
  *)       usage >&2; exit 2 ;;
esac
