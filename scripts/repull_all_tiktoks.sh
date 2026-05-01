#!/bin/bash
# One-shot: re-pull ALL TikToks from @federicozimerman, regardless of seen_ids state.
# Use: when transcripts have been lost (e.g. wiped from untracked state) and you
# need to rebuild the local archive. Subsequent daily scans will see them as
# already-transcribed via the file-existence check in download_and_transcribe().
#
# Schedule via launchd (com.revfactor.repull-tiktoks) or run manually.

set -euo pipefail

REPO="/Users/aaronwhittaker/Claude/RevFactor"
PYTHON="$REPO/.venv/bin/python3"
LOG="/tmp/revfactor-repull.log"

exec >>"$LOG" 2>&1

echo "=== $(date) === Starting full TikTok re-pull"

cd "$REPO"

# Clear the tiktok seen-ids list so the scan reprocesses everything that's not
# already on disk. (Existing transcript files still get SKIP'd by the script's
# file-existence check, so we don't burn quota re-transcribing files we have.)
"$PYTHON" - <<'PY'
import json
from pathlib import Path
state_path = Path('/Users/aaronwhittaker/Claude/RevFactor/scripts/seen_ids.json')
state = json.loads(state_path.read_text()) if state_path.exists() else {}
state['tiktok'] = []  # reset only the TikTok list — keep IG state
state_path.write_text(json.dumps(state, indent=2))
print(f"Reset tiktok seen-list. IG state preserved ({len(state.get('instagram', []))} posts).")
PY

# Run the daily scan — it'll see all 90 TikToks as "new" and pull whichever
# don't have transcript files on disk yet. Auto-commits at the end.
"$PYTHON" "$REPO/scripts/scan_and_transcribe.py"

echo "=== $(date) === Re-pull complete"

# Self-unload the launchd job (one-shot — don't fire again)
launchctl unload "$HOME/Library/LaunchAgents/com.revfactor.repull-tiktoks.plist" 2>/dev/null || true
echo "Self-unloaded launchd job"
