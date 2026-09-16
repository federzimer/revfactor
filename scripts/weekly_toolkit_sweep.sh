#!/bin/bash
# weekly_toolkit_sweep.sh — launchd wrapper for the weekly RevFactor toolkit sweep.
# Label: com.revfactor.weekly-sweep (Sunday 18:00 local). Logs to scripts/logs/.
set -u

export PATH="/Users/aaronwhittaker/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

# Doppler: the CLI global login on this Mac is used (the old keychain token lookup
# pointed at an entry that does not exist and could trigger a System-keychain prompt).

exec /usr/bin/python3 /Users/aaronwhittaker/Claude/RevFactor/scripts/weekly_toolkit_sweep.py "$@"
