# LogMyDance — Google Play Store Listing (draft)

> Draft copy for the Play Console listing. Two locales: **en-US** (default) and **pt-BR** (key market: forró).
> Char limits enforced by Play: app name ≤30, short description ≤80, full description ≤4000.
> Tone: focused, private, practical. No medical/efficacy claims. App is free, no ads, no IAP (yet).

---

## App name (≤30 chars)

| Locale | Option (count) |
|---|---|
| en-US | `LogMyDance: Dance Journal` (25) |
| pt-BR | `LogMyDance: Diário de Dança` (27) |

Fallback if you want just the brand: `LogMyDance` (10).

---

## Short description (≤80 chars)

**en-US**
```
Your private dance journal: log classes, track moves, master your footwork.
```
(74)

**pt-BR**
```
Seu diário de dança privado: registre aulas, movimentos e suas pisadas.
```
(70)

---

## Full description (≤4000 chars)

### en-US

```
LogMyDance is the private journal for dancers who want to remember what they learn and actually see themselves improve.

Whether you dance forró, bachata, salsa, zouk or anything else, every class brings new figures, footwork and corrections — and most of it is forgotten by the next week. LogMyDance keeps it all in one place, on your phone, for your eyes only.

LOG EVERY CLASS
• Record style, instructor, location, duration, mood and notes
• Tag classes and reuse templates for your weekly schedule
• Build a history you can actually look back on

BUILD YOUR MOVEMENT LIBRARY
• Save each figure or movement with notes and a status: new, learning, needs practice, comfortable, mastered
• Attach a video — record it, pick from your gallery, or import a file
• Watch your progress on a move grow over time

FOOTWORK, STEP BY STEP (built for forró)
• Mark the steps ("pisadas") right on the video timeline
• Get the natural BPM of a movement from your markers
• Categorize moves by attributes: starting/ending foot, hands, number of steps, tempo, turn, difficulty and more — fully customizable

CHAIN MOVES INTO SEQUENCES
• Filter your library and assemble sequences
• Play clips back-to-back, synced to a tempo you choose
• Practice transitions, not just isolated moves

SEE YOUR PROGRESS
• Streaks, weekly and monthly activity, total practice time
• Breakdown by style, mood and movement status

YOURS, AND PRIVATE BY DESIGN
• Everything stays on your device — no account, no cloud, no behavioral tracking
• Full backup and restore: export a single file with your data and videos, import it on a new phone
• Available in English and Portuguese

LogMyDance is free. No ads. No data harvesting. Just you, your dancing, and a memory that doesn't fade.
```

### pt-BR

```
LogMyDance é o diário privado para dançarinos que querem lembrar o que aprendem e realmente ver a própria evolução.

Seja no forró, bachata, salsa, zouk ou qualquer outra dança, cada aula traz figuras, pisadas e correções novas — e quase tudo se perde até a semana seguinte. O LogMyDance guarda tudo num só lugar, no seu celular, só para você.

REGISTRE CADA AULA
• Anote estilo, professor, local, duração, humor e observações
• Use tags e modelos (templates) para a sua rotina semanal
• Construa um histórico que dá pra revisitar de verdade

MONTE SUA BIBLIOTECA DE MOVIMENTOS
• Salve cada figura ou movimento com notas e um status: novo, aprendendo, precisa praticar, confortável, dominado
• Anexe um vídeo — grave na hora, escolha da galeria ou importe um arquivo
• Acompanhe a evolução de cada movimento ao longo do tempo

PISADAS, PASSO A PASSO (feito para o forró)
• Marque as pisadas direto na linha do tempo do vídeo
• Descubra o BPM natural do movimento a partir das suas marcações
• Categorize por atributos: pé de início/fim, mãos, número de pisadas, andamento, giro, dificuldade e mais — totalmente personalizável

ENCADEIE MOVIMENTOS EM SEQUÊNCIAS
• Filtre sua biblioteca e monte sequências
• Reproduza os clipes em sequência, sincronizados no andamento que você escolher
• Treine as transições, não só os movimentos isolados

VEJA SEU PROGRESSO
• Ofensivas (streaks), atividade semanal e mensal, tempo total de prática
• Resumo por estilo, humor e status dos movimentos

SEU, E PRIVADO POR PRINCÍPIO
• Tudo fica no seu aparelho — sem conta, sem nuvem, sem rastreamento de comportamento
• Backup e restauração completos: exporte um único arquivo com seus dados e vídeos e importe em outro celular
• Disponível em português e inglês

O LogMyDance é gratuito. Sem anúncios. Sem coleta de dados. Só você, sua dança e uma memória que não desbota.
```

---

## Graphics checklist (you supply these)

| Asset | Spec | Source / note |
|---|---|---|
| App icon (hi-res) | 512×512 PNG, 32-bit, no alpha for store | export from kit `noite` master (1024 → 512) |
| Feature graphic | 1024×500 PNG/JPG, no alpha | glyph left + #0a0a0a negative space (kit lockup/emblema) |
| Phone screenshots | min 2, up to 8; 16:9 or 9:16; ≥320px side | see suggested shots below |
| (optional) 7"/10" tablet shots | only if you list tablet support | iOS supportsTablet=true; Android optional |

**Suggested screenshots (capture on the emulator/device):**
1. Home / entries list (history)
2. Movement detail with video + status
3. Step markers screen (pisadas on the timeline) — the differentiator
4. Sequence player (BPM sync)
5. Stats (streaks + breakdowns)
6. New entry form (shows logging depth)

Tip: add a one-line caption band per screenshot (PT/EN) so the value reads at a glance in the store.

---

## Categorization & compliance (Play Console)

- **Category:** Health & Fitness (primary). Alt: Lifestyle.
- **Tags:** dance, journal/diary, practice, fitness.
- **Content rating:** target **Everyone / Livre**. Questionnaire: no violence, no user-to-user sharing (videos are local only), no UGC feed. Declare accordingly.
- **Target audience:** 13+ (or 18+ if you prefer to dodge the kids-policy questionnaire entirely).
- **Data safety form:** "No data collected / No data shared" — everything is on-device. If you later set the Sentry DSN, declare **Crash logs** (collected, not shared, for app functionality). Currently DSN empty = nothing to declare.
- **Privacy Policy URL:** **https://tarcisiowes.github.io/logmydance/** (live, EN/PT). Same URL goes in the Data safety section.
- **App access:** all features available without login (note this in the "App access" section so review isn't blocked).
- **Ads:** declare **No ads**.

---

## ASO notes (optional)
- Keep "dance journal" / "diário de dança" + "forró" in the short description and early in the full description — those are the searches you'll win first.
- Brazil + forró is the beachhead. English listing widens reach (bachata/salsa/zouk crowds) at no extra cost.
- App name carries the most ASO weight; "Dance Journal" / "Diário de Dança" in the title is deliberate.
```
