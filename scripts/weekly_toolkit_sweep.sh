#!/bin/bash
# weekly_toolkit_sweep.sh — launchd wrapper for the weekly RevFactor toolkit sweep.
# Label: com.revfactor.weekly-sweep (Sunday 18:00 local). Logs to scripts/logs/.
set -u

export PATH="/Users/aaronwhittaker/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

# Doppler auth: prefer a keychain service token if present; otherwise the
# doppler CLI's own login (already configured globally on this Mac) is used.
if TOKEN=$(security find-generic-password -s doppler-token -w 2>/dev/null); then
  export DOPPLER_TOKEN="$TOKEN"
fi

exec /usr/bin/python3 /Users/aaronwhittaker/Claude/RevFactor/scripts/weekly_toolkit_sweep.py "$@"
