# LogMyDance — Play Console form answers (Internal testing)

> Copy-paste answers for the required "Set up your app" / Dashboard forms.
> Based on the real app: on-device dance journal, no account, no ads, no analytics.
> Privacy policy: **https://tarcisiowes.github.io/logmydance/**
> Contact email: **showasoul@icloud.com**

---

## 1. App access
- **All functionality is available without special access.** ✅
- No login, no account, no region lock. (If a form asks for instructions/credentials, leave empty — none needed.)

## 2. Ads
- **No, my app does not contain ads.** ✅

## 3. Content rating (IARC questionnaire)
- Email: `showasoul@icloud.com`
- Category: **Reference, News, or Educational** (or "Utility/Productivity" if offered; it's a journaling/practice app).
- Answer **No** to all of: violence, sexual content, profanity, drugs/alcohol/tobacco, gambling (real or simulated), fear/horror.
- "Users can interact / communicate / share content with each other?" → **No** (videos and notes stay on-device; nothing is shared to other users or posted online).
- "Shares user's current physical location?" → **No**.
- "Allows purchase of digital goods?" → **No**.
- Expected result: **Everyone / PEGI 3 / Livre (L)**.

## 4. Target audience and content
- Target age group: **13–15, 16–17, 18 and over** (do NOT include under-13 → avoids Families Policy / "designed for children").
- "Is your app appealing to children?" → **No**.
- Store presence to children: **No**.

## 5. Data safety  ← most important, do it right
- "Does your app collect or share any of the required user data types?" → **No.**
  - Everything (classes, movements, videos, notes, backups) is stored only on the device. No servers, no account, no analytics.
- Data encrypted in transit: **N/A** (no data leaves the device).
- Way to request data deletion: **N/A** (no account; user controls/deletes data on-device; uninstalling removes all data).
- Result shown on store: **"No data collected · No data shared."**
- ⚠️ If you later set the Sentry DSN (`extra.sentryDsn`), you MUST update this to declare **Crash logs / Diagnostics** (collected, not shared, for app functionality). Right now DSN is empty = nothing collected.

## 6. Privacy policy
- URL: **https://tarcisiowes.github.io/logmydance/**

## 7. Advertising ID
- "Does your app use an advertising ID?" → **No** (no ads, no behavioral analytics).
- If Play warns the app declares the `AD_ID` permission (pulled transitively by a lib), you can remove it later via an app.json AndroidManifest tweak — not a blocker for internal testing.

## 8. Other declarations (all No)
- Government app: **No**
- Financial / banking features: **No**
- News app: **No**
- COVID-19 contact tracing/status: **No**
- Health Connect / sensitive health data: **No** (it logs dance practice, not health data — if the "Health apps" declaration appears because of the category, declare it does NOT access Health Connect or read/write health data; or use **Lifestyle** category to skip this form entirely).

## 9. Store settings
- **App category:** Health & Fitness (alt: Lifestyle — avoids the health declaration in #8).
- **Tags:** dance, journal/diary, practice.
- **Contact email:** `showasoul@icloud.com` (required). Phone/website optional.
- **Default language:** your call — `en-US` (intl reach) with `pt-BR` added, or `pt-BR` first (Brazil/forró beachhead). Listing copy for both is in `store-listing.md`.

## 10. Store listing (text ready in store-listing.md; you still supply graphics)
- App name: `LogMyDance: Dance Journal` (en) / `LogMyDance: Diário de Dança` (pt) — ≤30 chars.
- Short + full description: see `docs/store-listing.md`.
- **Graphics to upload:** app icon 512×512 · feature graphic 1024×500 · ≥2 phone screenshots (suggested shots listed in store-listing.md).

---

### Release (Internal testing)
1. Testing → Internal testing → Create release → upload the EAS `.aab` (versionCode 4) → accept Play App Signing.
2. Fill all the above (the Dashboard shows which are still pending).
3. Add tester emails (or a Google Group) → Save → Review release → **Roll out to Internal testing**.
4. Share the opt-in link with testers.
