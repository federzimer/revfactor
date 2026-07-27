#!/bin/bash
# brain_scan_wrapper.sh — reliability wrapper around scan_and_transcribe.py.
#
# Runs the RevFactor brain scan on an always-on host, records a success
# heartbeat, and SMS-alerts Aaron on failure OR on a stale heartbeat (the
# check that would have caught the 5-week silent failure since Jun 23).
#
# Reuses the existing Twilio SMS helper at
# ~/Claude/personal-automation/send-sms.sh (project_followup_system).
#
# Intended to run daily via launchd (com.revfactor.brain-scan).
set -uo pipefail

REPO="/Users/aaronwhittaker/Claude/RevFactor"
SCRIPTS="$REPO/scripts"
PY="$REPO/.venv/bin/python3"
SCAN="$SCRIPTS/scan_and_transcribe.py"
SEND_SMS="/Users/aaronwhittaker/Claude/personal-automation/send-sms.sh"
HEARTBEAT="$SCRIPTS/.brain_scan_last_success"
LOG_DIR="$SCRIPTS/logs"
TT_TRANSCRIPTS="$REPO/tiktok_videos/transcripts"
IG_TRANSCRIPTS="$REPO/instagram_videos/transcripts"
STALE_DAYS=7

mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/brain-scan-$(date +%F).log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

sms() {
  # Best-effort SMS; never let an alert failure crash the wrapper.
  if [ -x "$SEND_SMS" ]; then
    "$SEND_SMS" "$1" >>"$LOG" 2>&1 || log "SMS send failed (see log)"
  else
    log "SMS helper not found/executable at $SEND_SMS — cannot alert"
  fi
}

# Age of the heartbeat in whole days, or 9999 if missing/unreadable.
# Uses the file's mtime — which we set on every success write — so it is
# immune to timezone/ISO-parsing quirks across python versions.
heartbeat_age_days() {
  [ -f "$HEARTBEAT" ] || { echo 9999; return; }
  local mtime now
  mtime=$(stat -f %m "$HEARTBEAT" 2>/dev/null) || { echo 9999; return; }
  now=$(date +%s)
  echo $(( (now - mtime) / 86400 ))
}

count_transcripts() {
  # Count .txt transcripts across both dirs (0 if dirs absent).
  local n=0
  for d in "$TT_TRANSCRIPTS" "$IG_TRANSCRIPTS"; do
    [ -d "$d" ] && n=$((n + $(find "$d" -maxdepth 1 -name '*.txt' -type f 2>/dev/null | wc -l | tr -d ' ')))
  done
  echo "$n"
}

log "============================================================"
log "brain_scan_wrapper starting on $(hostname)"

# --- Staleness self-check (BEFORE this run updates the heartbeat) ----------
# If the last SUCCESS was >STALE_DAYS ago, the scan has been silently failing.
# Alert regardless of how today's run turns out. This is the guard the old
# laptop job lacked, which let it die unnoticed for ~5 weeks.
PRE_AGE=$(heartbeat_age_days)
if [ "$PRE_AGE" -gt "$STALE_DAYS" ]; then
  if [ ! -f "$HEARTBEAT" ]; then
    log "STALE: no heartbeat file yet (first run or never succeeded)"
    sms "RevFactor brain scan: no success heartbeat on record (host $(hostname)). Running now; will alert if this run also fails."
  else
    log "STALE: last success was ${PRE_AGE}d ago (> ${STALE_DAYS}d threshold)"
    sms "RevFactor brain scan hasn't succeeded in >${STALE_DAYS} days (last success ${PRE_AGE}d ago on $(hostname)). Fede's TikTok/IG content is not landing in the content brain — check ${LOG}."
  fi
fi

# --- Run the scan ----------------------------------------------------------
BEFORE=$(count_transcripts)
log "Transcripts before run: $BEFORE"

if [ ! -x "$PY" ]; then
  log "FATAL: venv python not found at $PY"
  sms "RevFactor brain scan FATAL: venv python missing at $PY on $(hostname). Scan did not run."
  exit 1
fi

cd "$REPO" || { log "FATAL: cannot cd to $REPO"; sms "RevFactor brain scan FATAL: repo missing at $REPO on $(hostname)."; exit 1; }

# errexit is intentionally NOT set, so a non-zero scan is handled below.
"$PY" "$SCAN" >>"$LOG" 2>&1
RC=$?

AFTER=$(count_transcripts)
NEW=$((AFTER - BEFORE))
[ "$NEW" -lt 0 ] && NEW=0
log "Scan exit code: $RC — new transcripts this run: $NEW (before=$BEFORE after=$AFTER)"

# --- Outcome handling ------------------------------------------------------
if [ "$RC" -ne 0 ]; then
  log "FAILURE: scan exited non-zero ($RC)"
  TAIL=$(tail -n 25 "$LOG" 2>/dev/null)
  sms "RevFactor brain scan FAILED (exit $RC) on $(hostname). Tail:
$TAIL"
  exit "$RC"
fi

# Success: stamp the heartbeat with an ISO timestamp.
date +%Y-%m-%dT%H:%M:%S%z > "$HEARTBEAT"
log "SUCCESS: heartbeat updated → $HEARTBEAT ($NEW new transcript(s))"
log "============================================================"
exit 0
