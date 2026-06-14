# Device verification — Step markers (pisadas) + BPM sync

**Feature:** handoff 18 (commits 1ee589c + 59abe45) + badge (handoff 20, c711025).
**Scope:** mark steps per movement video, play sequences synced to a common BPM.
**Build:** JS / expo-video only — **no native rebuild required** if a dev/debug
build already has `expo-video`, `expo-sqlite`, mmkv, reanimated, gesture-handler
linked (they do since Sprint 2). Run with the existing build: `npx expo start`
and open on the installed dev client, or reinstall the existing
`app-debug.apk`. A fresh `expo run:android` is only needed if the binary is
older than the SQLite layer.

Tick each box on a real device (Android first; repeat the playback section on
iOS if available — `playbackRate` honoring is the platform-specific risk).

---

## 0. Setup
- [ ] Device has ≥2 movements **with a ready video** (steps + sync need video).
- [ ] At least one movement video has a clear, countable beat (a forró step
      pattern) so marking is meaningful.

## 1. Migration / upgrade smoke  ⚠️ highest risk
The feature added the `movement_steps` table (`SCHEMA_VERSION 3`). Existing
installs upgrade via `CREATE TABLE IF NOT EXISTS` on init.
- [ ] Install **over** a previous build that had real data (don't wipe first).
- [ ] App launches with **no crash / no SQLite error**; existing entries,
      movements, sequences all still load.
- [ ] Open a movement → "Mark steps" works (table exists). No "no such table:
      movement_steps".

## 2. Marking screen — `movement/[id]` → "Mark steps"
- [ ] Movement detail (with video) shows a **"Mark steps"** button in the video
      section. Tapping opens the marking screen.
- [ ] Movement **without** video → marking screen shows "This movement has no
      video to mark." (no crash).
- [ ] Video renders; Play/Pause works; **Rewind / FastForward nudge ±0.1s**
      (small jumps, clamped at start/end).
- [ ] Tap the **timeline bar** → playhead seeks to that position; `x.xs / y.ys`
      readout updates.
- [ ] Pause on a beat → **"Mark step"** drops an **amber dot** at the playhead;
      footer count rises (`{n} steps`).
- [ ] Mark **≥2** beats → a **`NNN BPM`** value appears next to the count.
      (With 0 or 1 marker, **no BPM** is shown — by design, `naturalBpm` needs
      ≥2.)
- [ ] **Tap a dot** → that marker is removed; count + BPM update.
- [ ] **Clear** empties all markers; **Save** persists and returns to the
      movement.
- [ ] Markers stay **sorted** regardless of the order you marked them.

## 3. Persistence + library badge
- [ ] Reopen the same movement → "Mark steps" → the saved markers + BPM are
      **still there** (loaded from `movement_steps`).
- [ ] Re-saving with a different set **replaces** the old set (no duplicates /
      no leftover dots — `setTimes` is delete-then-insert).
- [ ] Movements tab: the marked movement's card shows the **footprints badge**
      (amber icon + count); the count **equals** the number of marked pisadas.
- [ ] An unmarked movement shows **no badge**.

## 4. Sequence playback — sync
Build a sequence with the 2 marked movements (`sequences` tab → new → filter →
append → save), then open it.
- [ ] **BpmControl card** ("Sync to BPM") appears under the player.
- [ ] Because ≥1 clip has ≥2 markers, **Sync is auto-ON** and the BPM field
      shows the **median** of the clips' natural BPMs (not always 120).
- [ ] Player plays clips **back-to-back** (auto-advance at each clip end); the
      **"Clip i/N"** badge (top-right) increments.
- [ ] **Step pulse:** an amber dot + **`stepCount/total`** (top-left) flashes as
      each marked beat is crossed; resets at each new clip.
- [ ] With Sync ON, a faster-recorded clip and a slower one **land on the same
      tempo** — the pulses across clips feel like one steady beat.
- [ ] Drag the BPM slider / use **− / +** while playing → the current clip's
      speed changes **live**.
- [ ] Toggle **Sync OFF** mid-play → clips return to **1× / natural speed**
      live.
- [ ] `SkipBack` / `SkipForward` jump clips (disabled at the ends); after the
      last clip the button becomes **replay** (↺) and restarts from clip 1.

## 5. Edge cases
- [ ] Sequence where **no** clip has markers → BpmControl toggle is **disabled**
      with hint "Mark steps on movements to sync their tempo." Playback is plain
      1×, no pulse.
- [ ] Mixed sequence (one clip ≥2 markers, one with 0/1) → the unmarked clip
      plays at **1×** with no pulse; the marked clip still syncs + pulses; both
      advance normally.
- [ ] Extreme target: set BPM to **180** against a slow ~60-BPM clip → clip
      speeds up but is **clamped at 4×** (and 0.25× the other way) — no freeze /
      no audio garble beyond that.
- [ ] Reopen the saved sequence → sync state is **recomputed from markers**
      (auto-default again); confirms sync is **transient**, not persisted on the
      sequence.

## 6. Backup round-trip
- [ ] Storage & Backup → **Export** a backup that includes the marked movements.
- [ ] On a **clean** app (wipe data or fresh install) → **Import** that backup.
- [ ] Markers are **intact** (`movement_steps` is in the backup at
      `APP_SCHEMA_VERSION 3`): badges show, marking screen shows the dots,
      sequence sync still engages.

## 7. Platform / perf notes to record
- [ ] iOS: does `player.playbackRate` honor rates **>2×** and **<0.5×**? Note
      any audio dropouts (informs the future FFmpeg `atempo` export, phase 3).
- [ ] Any jank when swapping clips at high rate (`replaceAsync` + rate re-apply)?

---

## Sign-off
| Section | Pass | Notes |
|---|---|---|
| 1 Migration | | |
| 2 Marking | | |
| 3 Persistence + badge | | |
| 4 Sequence sync | | |
| 5 Edge cases | | |
| 6 Backup | | |

**Result:** ☐ green → close feature  ·  ☐ issues → file under `docs/handoff/` next
