# EP.01 Shorts — first production batch (7 clips)

**Status:** metadata complete, **cutting blocked on source media** (see §4)
**Source:** Fede's Riverside recording of podcast EP.01, 36:38
**Clip list from:** mailbox #79 and #81 (#81 supersedes on timestamps)
**Channel:** RevFactor (`UCExLdFuaqd5poT7bzA_SAAw`), cross-post to Federico Zimerman
(`UCH6QCPOP2GwxOoPDeiz72QA`)

---

## 1. Publishing hold — read first

Fede is re-cutting EP.01's intro and adding a hook/CTA before the full episode goes live.
The seven clips are all mid-episode, so **cutting now is safe, publishing is not.** Upload
private, hold public until his revised episode is up.

Quota is roughly 6 uploads/day (1,600 units each against a 10,000/day allowance), so seven
clips is a two-day batch, or one day if the eighth slot is left alone.

## 2. The clips

Timestamps for clips 6 and 7 are approximate in the source note and **must be verified
against the audio** before cutting.

| # | In–Out | Runtime | Hook | Proposed title |
|---|--------|---------|------|----------------|
| 1 | 06:37–07:59 | 1:22 | Executives paid $7,000 for business class when first class was $4,500, and got a $3,000 refund | `The $7,000 Seat That Cost Less in First Class` |
| 2 | 08:30–09:30 | 1:00 | A plane takes off with an empty seat and we can never sell that seat again. Your Airbnb is the same. | `Why an Empty Airbnb Night Is Worth Exactly Zero` |
| 3 | 04:34–06:37 | 2:03 | You never know what you will pay for a flight. Never. The Sunday-stay rule. | `Why Incognito Mode Never Got You a Cheaper Flight` |
| 4 | 16:24–17:26 | 1:02 | Pricing by last year's numbers is looking at a picture. You need the movie. | `Stop Pricing Your Airbnb From Last Year's Numbers` |
| 5 | 19:54–20:27 | 0:33 | You get the booking notification and think: could I have charged more? | `That Booking Notification Feeling, Explained` |
| 6 | ~25:30–27:30 | ~2:00 | Delta's Atlanta to DC flight departed 100% full and was losing money | `This Flight Was 100% Full and Still Lost Money` |
| 7 | ~30:45–32:29 | ~1:44 | I always fly first class for the price of a coach ticket | `How I Fly First Class for the Price of Coach` |

**Editorial note on runtime.** Clips 3, 6 and 7 run near or past two minutes. They fit inside
the Shorts limit but that is long for Shorts retention, and each has a single payoff line.
Recommend tightening 3, 6 and 7 to roughly 60 to 75 seconds around their hook when cutting,
and keeping the full version in reserve if a longer cut is wanted later.

**Strongest of the batch is clip 2.** It is the cleanest atomic claim in the set, which is
the thing an AI answer can lift whole. If only one ships first, ship that one.

## 3. Description template

First line answers the video's question, because AI reads descriptions. Same shape for all
seven, swapping the first line.

```
<one-sentence answer to the clip's question>

Federico Zimerman spent ten years pricing airline seats before he started pricing
short-term rentals. RevFactor runs done-for-you revenue management for STR owners.

Full episode: <EP.01 link, once Fede's re-cut is live>
Book a strategy call: https://www.revfactor.io/
```

## 4. Caption QC

The auto-transcription mishears these every time. This is the union of both lists in #79 and
#81. #81 dropped the fourth one, so check against this table, not against #81.

| Heard as | Correct |
|---|---|
| Refactor | RevFactor |
| Panama | Pan Am |
| Bale | Vail |
| chicken restrictions | check-in restrictions |

## 5. What is blocking cutting

The EP.01 media is not on this machine. `/tmp/fede_ep1.mp3` and `/tmp/fede_ep1_transcript.txt`
are paths on Aaron's Studio. Two separate problems:

1. **We need the file at all.** Nothing under `~/Claude` or `/tmp` here holds it.
2. **The saved file is audio.** `fede_ep1.mp3` cannot produce a Short. The Riverside
   recording itself is what we need, and the share link in #81 plays without login but is a
   player, not a download.

Cleanest unblock is Fede's Riverside export, or the raw recording dropped in a shared folder.
`ffmpeg` and `ffprobe` are installed here, so cutting is fast once the file lands.

## 6. Channel state as of 2026-08-07

Verified live with `yt.py list` against the RevFactor token:

| Video ID | Privacy | Date | Title |
|---|---|---|---|
| `QxQRxlTOUYw` | **public** | 2026-08-04 | Free Comps Hiding in Airbnb |
| `0cfjtbPuVj8` | unlisted | 2026-07-01 | How to Manage Your Subscription |
| `NOHgs6Tcjno` | unlisted | 2026-06-26 | What RevFactor does, in a few minutes. |

Two things follow from that first row. The channel is **not** empty, so this batch is not the
channel's launch and titles should read as a series rather than an introduction. And a video
is already public, which means the "uploads land private regardless of the flag" limit in #82
either has been worked around manually in Studio or no longer applies. Worth confirming with
Aaron before planning a scheduled batch around it.

Note also that `QxQRxlTOUYw` is the free-comps tactic, which is Way 2 in the Track B edit
script. Reusing it inside the long-form compilation is fine and intended, but the Short
already exists and should not be cut twice.
