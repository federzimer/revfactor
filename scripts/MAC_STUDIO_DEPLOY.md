# RevFactor Brain Scan — Mac Studio deploy runbook

Move the daily Fede TikTok/IG → content-brain scan off the laptop (which sleeps and
died silently since Jun 23) onto the always-on Mac Studio, with a reliability wrapper
that SMS-alerts on failure **and** on a stale heartbeat.

**⚠️ Correction to the original brief:** the scan does **NOT** use Whisper/OpenAI. It
transcribes with **Gemini 2.5 Flash** via `google-genai`, keychain service
**`gemini-revfactor`** (see `scan_and_transcribe.py` lines 23, 44, 68). There is no
OpenAI dependency. The reliability upgrade does not change transcription — only where
it runs and how failures surface.

All commands run from the **MacBook**, SSH-ing to the Studio. SSH details:
`reference_mac_studio_ssh_access` (user `aaronwhittaker`, host `aarons-mac-studio.local`,
key `~/.ssh/id_ed25519`). Keychain writes over SSH fail with "User interaction is not
allowed" — see step (c) for the launchd workaround.

```bash
SSH='ssh -o ConnectTimeout=5 -i ~/.ssh/id_ed25519 aaronwhittaker@aarons-mac-studio.local'
REPO=/Users/aaronwhittaker/Claude/RevFactor
```

> **BLOCKER to confirm first:** the runbook assumes the repo lives at
> `/Users/aaronwhittaker/Claude/RevFactor` on the Studio (same path as the MacBook).
> Confirm before running — if the Studio uses a different path, adjust `$REPO` and the
> absolute paths inside `brain_scan_wrapper.sh` and the plist. Also confirm the SMS
> helper exists on the Studio (step d).

## a) Ensure the repo is present + up to date on the Studio

```bash
# If already cloned:
$SSH "cd $REPO && git pull --ff-only"

# If NOT present, clone it (get the remote URL from the MacBook first):
#   git -C $REPO remote get-url origin
# then on the Studio:
#   $SSH "git clone <ORIGIN_URL> $REPO"
```

Confirm the new files landed (they're committed in the repo):
```bash
$SSH "ls -l $REPO/scripts/brain_scan_wrapper.sh $REPO/scripts/com.revfactor.brain-scan.macstudio.plist"
```

## b) Create/verify the .venv with the deps the scan needs

Deps the script actually imports (verified against `scan_and_transcribe.py` + the working
MacBook venv): **google-genai, yt-dlp, curl_cffi, instaloader, requests**. System binary:
**ffmpeg** (Homebrew `/opt/homebrew/bin/ffmpeg`). `urllib`/`json`/`subprocess` are stdlib.

```bash
# ffmpeg (system):
$SSH 'which ffmpeg || /opt/homebrew/bin/brew install ffmpeg'

# venv + deps:
$SSH "cd $REPO && python3 -m venv .venv && \
  .venv/bin/python3 -m pip install --upgrade pip && \
  .venv/bin/python3 -m pip install google-genai yt-dlp curl_cffi instaloader requests"

# Verify imports resolve:
$SSH "$REPO/.venv/bin/python3 -c 'import google.genai, yt_dlp, curl_cffi, instaloader, requests; print(\"deps OK\")'"
```

## c) Ensure keychain has gemini-revfactor + apify-instagram on the Studio

The scan needs **`gemini-revfactor`** (required — transcription) and **`apify-instagram`**
(recommended — the only unattended IG path). `openai` is NOT used by this scan; skip it.

Check what's already there (metadata reads work over SSH; value reads may not):
```bash
$SSH 'for k in gemini-revfactor apify-instagram; do \
  security find-generic-password -s "$k" >/dev/null 2>&1 && echo "$k: present" || echo "$k: MISSING"; done'
```

If missing, copy the values from the MacBook keychain. Because `security add-generic-password`
over SSH fails ("User interaction is not allowed"), install via a one-shot launchd job that
runs in the Studio's unlocked GUI session (per `reference_mac_studio_ssh_access`):

```bash
# On the MacBook, read the two values:
GEM=$(security find-generic-password -s gemini-revfactor -w)
APIFY=$(security find-generic-password -s apify-instagram -w)

# Push a one-shot installer plist to the Studio that writes them into its login keychain:
$SSH "cat > ~/Library/LaunchAgents/com.revfactor.kc-install.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.revfactor.kc-install</string>
  <key>RunAtLoad</key><true/>
  <key>ProgramArguments</key><array>
    <string>/bin/bash</string><string>-c</string>
    <string>security add-generic-password -U -a "\$USER" -s gemini-revfactor -w '$GEM'; security add-generic-password -U -a "\$USER" -s apify-instagram -w '$APIFY'</string>
  </array>
</dict></plist>
PLIST

$SSH 'launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.revfactor.kc-install.plist; \
  sleep 3; launchctl bootout gui/$(id -u)/com.revfactor.kc-install 2>/dev/null; \
  rm -f ~/Library/LaunchAgents/com.revfactor.kc-install.plist'

# Verify + (optional) make SSH-readable going forward:
$SSH 'security find-generic-password -s gemini-revfactor >/dev/null 2>&1 && echo "gemini OK"'
```

## d) Ensure the SMS helper is present on the Studio

The wrapper alerts via `~/Claude/personal-automation/send-sms.sh` (Twilio; reads
`.sms.env` next to it). Confirm both exist on the Studio:
```bash
$SSH 'ls -l ~/Claude/personal-automation/send-sms.sh ~/Claude/personal-automation/.sms.env'
```
If missing, sync the `personal-automation` dir (incl. the secret `.sms.env`) from the
MacBook — e.g. `scp` `send-sms.sh` + `.sms.env`, or `rsync` the folder. Without this the
scan still runs; it just can't text on failure (it logs "SMS helper not found").

## e) Install + load the launchd plist on the Studio

```bash
$SSH "cp $REPO/scripts/com.revfactor.brain-scan.macstudio.plist \
  ~/Library/LaunchAgents/com.revfactor.brain-scan.plist"
$SSH 'launchctl bootout gui/$(id -u)/com.revfactor.brain-scan 2>/dev/null; \
  launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.revfactor.brain-scan.plist'
# RunAtLoad fires one run immediately — watch it:
$SSH "tail -n 40 $REPO/scripts/logs/brain-scan-\$(date +%F).log"
```

## f) Disable the OLD laptop job so it does not double-run

On the **MacBook** (the old job label is also `com.revfactor.brain-scan`):
```bash
launchctl bootout gui/$(id -u)/com.revfactor.brain-scan 2>/dev/null
launchctl disable gui/$(id -u)/com.revfactor.brain-scan
mv ~/Library/LaunchAgents/com.revfactor.brain-scan.plist \
   ~/Library/LaunchAgents/com.revfactor.brain-scan.plist.disabled
```

## One-line manual test (on the Studio)

```bash
$SSH "bash $REPO/scripts/brain_scan_wrapper.sh; echo exit=\$?; \
  cat $REPO/scripts/.brain_scan_last_success"
```
Expect `exit=0` and a fresh ISO timestamp in `.brain_scan_last_success`. On the first
run the wrapper will text once ("no success heartbeat on record") — that's the staleness
guard proving it works; it goes quiet once a success is recorded.
