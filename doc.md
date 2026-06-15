# LogMyDance — Leitura do App Atual + Gaps para MVP e Teste Interno (Google Play)

> Gerado em 2026-06-15. Branch `master`, último commit `75c6d18`.
> Referência de produto: `docs/logmydance-roadmap.md` (v3.1, 8.7/10).

---

## 1. Estado atual (o que já está construído)

App de journaling para dançarinos. Stack: Expo SDK 56, RN 0.85.3, React 19, expo-router, expo-sqlite + drizzle, NativeWind v4, zustand, MMKV. Tema escuro, accent violeta. Dados 100% no device ("private by design").

**Funcionalidades implementadas (código completo no `master`):**

| Área | Status | Telas / módulos |
|---|---|---|
| CRUD de aulas (entries) | ✅ | `app/entry/new`, `app/entry/[id]`, lista em `(tabs)/index` |
| Biblioteca de movimentos | ✅ | `app/movement/new`, `app/movement/[id]`, `(tabs)/movements` |
| Templates de aula | ✅ | `app/template/*`, `(tabs)/templates`, prefill no new entry |
| Tags | ✅ | `app/tags`, vínculo entry/template |
| Vídeo (import/record/files + thumbnail + player) | ✅ | `video-import.ts`, `VideoSection`, `expo-video` |
| Vínculo entry ↔ movimento | ✅ | `MovementPicker` |
| Progresso de status de movimento | ✅ | `movement_progress`, `movementsRepo.updateStatus` |
| Categorização forró (atributos) + Sequences | ✅ | `categories`, 5ª tab `sequences`, builder/viewer/player |
| Step markers (pisadas) + BPM sync | ✅ | `app/steps/[id]`, `tempo.ts`, `BpmControl` |
| Storage manager + Backup zip (export/import) | ✅ | `app/storage`, `services/backup/*` |
| Stats (streaks/semana/mês/por-estilo/mood) | ✅ | `(tabs)/stats`, `repositories/stats.ts` |
| i18n EN + PT-BR (app inteiro) | ✅ | `src/i18n/*` |
| Onboarding (3 slides) | ✅ | `app/onboarding`, gate MMKV |
| Settings + Beta diagnostics + feedback mailto | ✅ | `app/settings` |
| Privacy Policy in-app (EN/PT-BR) | ✅ | `src/content/privacy.ts`, `app/privacy` |
| Sentry crash-only (no-op sem DSN) | ✅ | `services/sentry.ts` |
| R8/ProGuard + shrinkResources | ✅ (flags) | `android/gradle.properties` |

**Conclusão:** o produto está, em código, **acima do MVP do roadmap** (Sprints 1–5 + 7 + extras de forró/sequences). O que falta **não é feature** — é **ops, build de release e contas/assets de store.**

---

## 2. O que falta para o MVP (funcional, testável em device)

O código existe mas **nunca foi rebuildado/testado em device** desde várias deps nativas novas. Isso é o gap real do MVP.

### 🔴 Blockers (impedem rodar o MVP de verdade)

1. **Rebuild nativo pendente.** Deps nativas adicionadas sem rebuild: `expo-localization`, `@sentry/react-native ~7.11`, `expo-media-library ~56.0.7`, `react-native-zip-archive`. Sem rebuild, i18n/backup/captura de vídeo/crash não funcionam em device.
   → `npx expo run:android` (linka tudo de uma vez).

2. **Nada device-testado.** Há checklist QA não executado (`docs/qa/2026-06-14-step-markers-bpm-sync-device-check.md`). Backup zip (`react-native-zip-archive`) nunca validado em hardware — é o item de maior risco (quality gate do Sprint 3 do roadmap: roundtrip export→reinstall→import).

### 🟡 Importante (qualidade do MVP)

3. **Sem testes automatizados.** Zero arquivos `*.test.ts`. Aceitável para MVP solo, mas o roundtrip de backup deveria ter ao menos teste manual documentado.

4. **`extra.feedbackEmail` vazio** em `app.json`. O botão de feedback do beta (Settings) abre `mailto:` vazio → canal de feedback do beta quebrado. Preencher antes de distribuir.

5. **`extra.sentryDsn` vazio.** Crash reporting é no-op. Opcional, mas o roadmap pede "crash-free >99%" — sem DSN não há como medir. Criar projeto Sentry e preencher (ou aceitar conscientemente sem).

### 🟢 Fora do escopo MVP (não bloqueia)

- Branch `feat/sequence-concat` (single-mp4 via ffmpeg) — **não mergear**, build não verificado, +20-40MB APK, risco de fork LGPL. Adiar.
- Sprint 6 (RevenueCat/paywall/IAP) — condicional a validação do beta. Não construir agora.

---

## 3. O que falta para postar no Google Play (teste interno)

Teste interno exige um **`.aab` assinado** + ficha mínima no Play Console + formulários de compliance. Estado atual:

### 🔴 Blockers de submissão

1. **Build de release assina com a DEBUG KEY.** `android/app/build.gradle` → bloco `release { signingConfig signingConfigs.debug }`. Google Play **rejeita** builds debug-signed/debuggable.
   → Gerar **upload keystore** real (`keytool`), criar `signingConfigs.release`, e/ou usar **Play App Signing**. **Não comitar a keystore nem senhas** (usar `gradle.properties` fora do git ou EAS secrets).

2. **Ícone é placeholder** (`assets/icon.png`, 6.5KB gerado por script). Substituir por ícone real 1024×1024 + adaptive icon foreground Android. Bloqueia uma listagem decente.

3. **`versionCode` mora só em `build.gradle`** (= 1). Não está em `app.json`. Um `expo prebuild --clean` **zera** isso. → Mover para `app.json` → `android.versionCode` (e `version`/`versionName`) para ser durável.

4. **Sem `eas.json` nem caminho de build de release definido.** Decidir: **EAS Build** (cloud, recomendado p/ assinatura gerenciada) **ou** `cd android && ./gradlew bundleRelease` (local). Sem isso não há `.aab`.

5. **Privacy Policy não tem URL pública.** Existe in-app (`src/content/privacy.ts`), mas o Play Console **exige uma URL hospedada**. → Publicar o texto numa página pública (GitHub Pages / Netlify / domínio) e colar a URL no console.

### 🟡 Compliance / ficha (Play Console — sem código)

6. **Data Safety form** — declarar que dados ficam no device, sem coleta comportamental (alinha com "private by design"). Se Sentry ativo, declarar crash data.
7. **Content rating** questionnaire (esperado: 4+ / livre).
8. **Categoria**: Health & Fitness ou Lifestyle. Target audience.
9. **Store listing**: título, descrição curta (80 chars) + longa, **screenshots** (mín. 2 phone), feature graphic 1024×500, ícone hi-res 512×512.
10. **Conta Google Play Developer** ativa (taxa única US$25) + app criado no console.

### 🟢 Verificações de quality gate (roadmap Sprint 7)

- `targetSdkVersion 35` ✅ (já em `app.json` + build.gradle).
- `npx expo install --check` — rodar e confirmar deps SDK-56.
- Verificar o `.aab` **minificado** (R8 + shrinkResources já com flags `true`; confirmar que sobrevive ao prebuild — flags estão em `gradle.properties`, **não** prebuild-durável; mover p/ `expo-build-properties` se for prebuildar).
- Confirmar `minSdkVersion` (default expo = 24 / Android 7; roadmap quer testar em API 29+).
- Cold start <2s, crash-free >99% (precisa Sentry DSN p/ medir).

---

## 4. Ordem de execução sugerida (caminho crítico até o teste interno)

```
PASSO 1 — Tornar o MVP rodável e testado
  [x] Preencher app.json: extra.feedbackEmail = showasoul@icloud.com  (2026-06-15)
  [x] npx expo run:android — BUILD SUCCESSFUL, nativos linkados, app sobe no emulador
  [~] Device test: sequence + áudio OK (usuário). FALTA confirmar explicitamente:
      EXPORT backup → reinstalar → IMPORT (roundtrip) = maior risco / quality gate Sprint 3
  [ ] Executar checklist QA de step-markers/BPM (docs/qa/...)
  [ ] sentryDsn ainda vazio (crash-free não medível até preencher) — opcional

PASSO 2 — Assets de release
  [x] Ícone real 1024x1024 + adaptive foreground (variante "noite" do kit:
      squircle near-black + footprint coral/pisada). icon.png + adaptive-icon.png.
      Paleta = terra (coral), NÃO o violet #9333ea da UI — split de marca consciente.
  [ ] (opcional) Play feature graphic 1024x500 + retheme UI p/ casar com ícone
  [x] Mover versionCode/version para app.json (android.versionCode=1, ios.buildNumber="1")
  [x] RESOLVIDO o gotcha do android/ commitado → adotado MANAGED PREBUILD:
      android/ + ios/ untracked (gitignored), expo-build-properties guarda R8/minify
      + targetSdk 35. app.json agora é fonte ÚNICA (ícone/versionCode/permissions/SDK).
      EAS prebuilda no cloud. (commit 6f4344e)
  [ ] Hospedar Privacy Policy → obter URL pública

PASSO 3 — Build assinado
  [x] Keystore real GERADO via EAS managed credentials (guardado nos servers EAS,
      sem arquivo local). Projeto @showa-soul/LogMyDance, projectId em app.json.
  [x] Assinatura: EAS injeta o keystore no cloud build (production = app-bundle).
      ⚠️ build.gradle release ainda usa signingConfigs.debug → só afeta ./gradlew
         LOCAL (assinaria debug). Caminho de release = EAS Build (correto). Se um dia
         buildar local p/ store, corrigir signingConfigs.release primeiro.
  [x] Criar eas.json (profiles development/preview/production + submit track=internal)
  [x] eas login + eas init (extra.eas.projectId criado)
  [ ] Gerar .aab: `eas build -p android --profile production` (consome build credit)
  [ ] Verificar minificação/tamanho do .aab
  [ ] submit ao Play precisa service-account JSON do Google (Passo 4)

PASSO 4 — Play Console (teste interno)
  [ ] Conta dev (US$25) + criar app
  [ ] Upload .aab no track "Internal testing"
  [ ] Data Safety form + Content rating + categoria + target audience
  [ ] Store listing mínimo (título, descrições, 2 screenshots, feature graphic, ícone 512)
  [ ] Privacy Policy URL no console
  [ ] Adicionar emails dos beta testers à lista interna → publicar track
```

---

## 5. Resumo executivo

| Pergunta | Resposta |
|---|---|
| **Features do MVP prontas?** | **Sim** — código acima do MVP do roadmap. |
| **Roda em device hoje?** | **Sim** (2026-06-15) — `expo run:android` OK, nativos linkados, sequence+áudio testado. Falta só validar roundtrip de backup. |
| **Pode subir no Google Play hoje?** | **Não** — assina com debug key, ícone placeholder, sem `.aab`, sem keystore, Privacy Policy sem URL. |
| **Maior risco técnico** | Backup zip (`react-native-zip-archive`) nunca testado em device — é quality gate do roadmap. |
| **Esforço restante** | Baixo em código; concentrado em **ops/build/contas/assets de store**. |

**Caminho mais curto:** Passo 1 (rebuild + testar, ~1 dia) → Passo 2–3 (keystore + ícone + URL + build, ~1 dia) → Passo 4 (console + ficha, ~meio dia). Nenhuma feature nova necessária para o teste interno.
