#!/bin/bash
# Daily: push Hub down-funnel conversions (booked call / won) to Google Ads.
set -u
cd "$HOME/Claude/RevFactor/scripts/google-ads"
/usr/bin/python3 hub_to_google_ads_uploader.py --live >> /tmp/revfactor-hub-ga.log 2>&1
rc=$?
echo "$(date) hub-ga-uploader rc=$rc" >> /tmp/revfactor-hub-ga.log
[ $rc -eq 0 ] && bash "$HOME/Claude/personal-automation/mark-job.sh" revfactor-hub-ga-uploader 2>/dev/null
exit 0
