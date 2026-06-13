# 💃 Log My Dance — Roadmap v3.1 (Final)

> **Base:** Roadmap v2 + v3 corrections
> **Esta versão:** aplica 3 ajustes finais de precisão (v3.1)
> **Status:** ✅ aprovado para implementação (8.7/10 em review externo)
> **Nota:** Para implementação (AGENTS.md, tickets, code comments, UI copy),
> usar inglês. Este doc em PT-BR é referência de produto/estratégia.

---

## Correções Aplicadas

| # | Problema na v2 | Correção v3 | Impacto |
|---|---|---|---|
| 1 | `expo-video-thumbnails` deprecated | Usar `generateThumbnailsAsync` do `expo-video` | Sprint 2 |
| 2 | Sentry usado como analytics comportamental | Sentry só para crash/error; feedback manual para retenção | Sprint 4-5 |
| 3 | Export/backup subespecificado | Spec completa com manifest.json e estrutura de zip | Sprint 3 |
| 4 | Schema de mídia frágil (video_path inline) | Nova tabela `media_assets` | Sprint 1-2 |
| 5 | `default_tags` como JSON em templates | Nova tabela relacional `template_tags` | Sprint 1 |
| 6 | Domínio/handles como P0 | Rebaixado para P1 no Sprint 0 | Sprint 0 |
| 7 | "Lifetime subscription" conceitualmente errado | Lifetime Pro = non-consumable IAP | Sprint 6 |
| 8 | Quality gates de store vagos | Targets explícitos para Android API e iOS metadata | Sprint 7 |

---

## CORREÇÃO 1: Thumbnails

### ❌ v2

```
Lib: expo-video-thumbnails
Task: Gerar thumbnail (expo-video-thumbnails)
```

### ✅ v3

```
Lib: expo-video (VideoPlayer.generateThumbnailsAsync)
Task: Gerar thumbnail via VideoPlayer.generateThumbnailsAsync([timeMs])
```

**Nota:** `expo-video-thumbnails` está deprecated desde SDK 55 e será removido no SDK 56. A funcionalidade migrou para `expo-video`.

**Detalhe de implementação:** `generateThumbnailsAsync` é método de `VideoPlayer`. Para gerar thumbnail de um vídeo importado, criar um player temporário, chamar `generateThumbnailsAsync([0])` (frame do segundo 0), salvar o resultado como arquivo persistente em DocumentDirectory, e registrar o `local_path` em `media_assets`. Descartar o player temporário depois.

**Impacto na lista de libs:**

```diff
MÍDIA
├── expo-image-picker
├── expo-video (playback + thumbnails via generateThumbnailsAsync)
- ├── expo-video-thumbnails
├── expo-file-system
```

---

## CORREÇÃO 2: Sentry ≠ Analytics

### ❌ v2

```
Eventos Sentry PERMITIDOS:
entry_created, movement_created, video_imported,
export_started, template_used, status_changed
```

### ✅ v3

**Sentry é EXCLUSIVAMENTE para crash/error/performance:**

```
SENTRY — PERMITIDO:
├── crash (unhandled exception)
├── unhandled_error
├── file_import_failed
├── video_thumbnail_failed
├── export_failed
├── restore_failed
├── db_migration_error
├── storage_permission_denied
└── purchase_error (sem detalhes do produto)

SENTRY — PROIBIDO:
├── entry_created
├── movement_created
├── video_imported
├── template_used
├── status_changed
├── note_text
├── teacher_name
├── location_name
├── video_filename
└── qualquer evento comportamental
```

**Como medir retenção no beta (sem analytics invasivo):**

Opção A — Tela "Beta Diagnostics" dentro do app:
```
O usuário vê seus próprios stats e pode copiar/enviar manualmente:

  entries_count: 12
  movements_count: 8
  videos_count: 4
  templates_used_count: 6
  last_entry_date: 2026-06-15
  days_since_install: 14
  app_opens_count: 22 (counter local em MMKV)
```

Opção B — Formulário semanal via Google Forms / Typeform:
```
1. Quantas entradas você criou esta semana?
2. Importou algum vídeo?
3. Usou template?
4. Procurou algum movimento antigo?
5. O que sentiu falta?
6. Continua usando? Por quê (não)?
```

**Razão:** "Private by design" não pode ser marketing vazio. Se o app promete que dados ficam no device, Sentry não deve rastrear comportamento.

---

## CORREÇÃO 3: Especificação de Export/Backup

### ❌ v2

```
Export manual: JSON (entradas + movimentos + tags) + zip com vídeos
Import de backup (JSON + zip → restaurar dados)
```

### ✅ v3

**Estrutura do arquivo de backup:**

```
logmydance-backup-2026-06-15.zip
├── manifest.json        ← metadados do backup
├── data.json            ← todas as tabelas serializadas
└── media/
    ├── vid_<uuid>.mp4   ← vídeos dos movimentos
    └── thumb_<uuid>.jpg ← thumbnails
```

**manifest.json:**

```json
{
  "app": "Log My Dance",
  "backup_version": 1,
  "schema_version": 1,
  "created_at": "2026-06-15T14:30:00.000Z",
  "platform": "android",
  "app_version": "1.0.0",
  "entries_count": 42,
  "movements_count": 18,
  "media_files": [
    {
      "id": "mov-uuid-1",
      "kind": "video",
      "filename": "vid_mov-uuid-1.mp4",
      "size_bytes": 15728640,
      "sha256": "a1b2c3d4..."
    },
    {
      "id": "mov-uuid-1",
      "kind": "thumbnail",
      "filename": "thumb_mov-uuid-1.jpg",
      "size_bytes": 51200,
      "sha256": "e5f6g7h8..."
    }
  ]
}
```

**data.json:**

```json
{
  "schema_version": 1,
  "exported_at": "2026-06-15T14:30:00.000Z",
  "styles": [...],
  "dance_entries": [...],
  "movements": [...],
  "entry_movements": [...],
  "tags": [...],
  "entry_tags": [...],
  "class_templates": [...],
  "template_tags": [...],
  "movement_progress": [...],
  "media_assets": [...]
}
```

**Regras de Import/Restore:**

```
1. VALIDAR manifest.json existe e backup_version é suportado
2. VALIDAR schema_version — se maior que o app suporta, recusar com mensagem clara
3. VERIFICAR integridade: sha256 de cada media file vs manifest
4. CONFLITO: se já existem dados no app, perguntar:
   a) "Substituir tudo" (wipe + import)
   b) "Mesclar" (adicionar sem duplicar por UUID)
   c) "Cancelar"
5. MÍDIA FALTANDO: se vídeo listado no manifest não está no zip:
   → importar dados sem o vídeo
   → marcar media_asset com status "missing"
   → mostrar aviso: "2 vídeos não foram encontrados no backup"
6. TRANSAÇÃO: import dentro de transaction SQLite — se falhar, rollback total
7. MIGRAÇÃO FUTURA: se schema_version do backup < schema_version do app:
   → aplicar migrations incrementais no data.json antes de inserir
```

**Lib de ZIP recomendada:**

```
react-native-zip-archive (para criar e extrair .zip no file system)
```

**Nota de implementação (react-native-zip-archive):**
```
Lib nativa — requer rebuild após instalação:
- iOS: pod install + rebuild
- Android: rebuild native app
- Testar criação E extração de ZIP em ambas as plataformas
- FALLBACK: se ZIP falhar em uma plataforma durante o beta,
  oferecer export JSON-only (sem vídeos) como alternativa temporária
  até resolver o problema nativo
```

**Quality Gate do Sprint 3:**
```
✅ Export gera .zip válido com manifest correto
✅ Import de backup em app limpo restaura 100% dos dados
✅ Import com vídeo faltando funciona com aviso
✅ Import com schema_version maior que o app → mensagem de erro clara
✅ Roundtrip: export → deletar app → reinstalar → import → dados intactos
✅ ZIP é acessível via Share Sheet (iOS) / Downloads (Android)
```

---

## CORREÇÃO 4: Tabela `media_assets`

### ❌ v2

```typescript
movements {
  video_path: text?
  thumbnail_path: text?
}
```

### ✅ v3

Mover mídia para tabela dedicada:

```typescript
media_assets {
  id: text PK (uuid)
  owner_type: text       // "movement" (extensível para "entry" no futuro)
  owner_id: text         // FK para movements.id
  kind: text             // "video" | "thumbnail"
  local_path: text       // caminho no DocumentDirectory
  original_filename: text?
  size_bytes: integer?
  mime_type: text?       // "video/mp4", "image/jpeg"
  duration_ms: integer?  // só para vídeos
  width: integer?
  height: integer?
  status: text           // "ready" | "missing" | "corrupted"
  created_at: text
}
```

**Benefícios:**
- Storage Manager calcula tamanho real com `SELECT SUM(size_bytes) FROM media_assets`
- Export itera `media_assets` em vez de parsear paths de movements
- Delete seguro: apagar file + row em uma transação
- Detectar arquivos órfãos: `media_assets` sem `owner_id` válido
- Recomprimir: filtrar `WHERE kind = 'video' AND size_bytes > threshold`
- Futuro: vincular mídia diretamente a entradas (fotos da aula, flyer do evento)

**Campo `movements` atualizado:**

```typescript
movements {
  id: text PK (uuid)
  name: text
  style_id: integer FK
  status: text
  notes: text?
  created_at: text
  updated_at: text
  // video_path e thumbnail_path REMOVIDOS
  // agora em media_assets com owner_type="movement", owner_id=movements.id
}
```

**Helper queries:**

```sql
-- Thumbnail de um movimento
SELECT local_path FROM media_assets
WHERE owner_type = 'movement' AND owner_id = ? AND kind = 'thumbnail'

-- Vídeo de um movimento
SELECT local_path FROM media_assets
WHERE owner_type = 'movement' AND owner_id = ? AND kind = 'video'

-- Storage total usado
SELECT SUM(size_bytes) as total FROM media_assets WHERE status = 'ready'

-- Arquivos órfãos (movimento deletado mas arquivo ficou)
SELECT ma.* FROM media_assets ma
LEFT JOIN movements m ON ma.owner_id = m.id AND ma.owner_type = 'movement'
WHERE m.id IS NULL
```

---

## CORREÇÃO 5: `template_tags` relacional

### ❌ v2

```typescript
class_templates {
  default_tags: text  // JSON array de tag_ids — frágil
}
```

### ✅ v3

```typescript
class_templates {
  id: text PK (uuid)
  name: text
  style_id: integer FK
  instructor: text?
  location: text?
  default_duration: integer?
  created_at: text
  // default_tags REMOVIDO
}

template_tags {
  template_id: text FK → class_templates.id
  tag_id: text FK → tags.id
  PRIMARY KEY (template_id, tag_id)
}
```

**Benefícios:**
- Deletar tag com segurança (CASCADE ou check antes)
- Filtrar templates por tag
- Sem JSON.parse manual
- Consistência referencial

---

## CORREÇÃO 6: Sprint 0 — Prioridades Ajustadas

### ❌ v2

```
- [ ] P0 — Registrar domínio e handles sociais (@logmydance)
- [ ] P1 — Pesquisar trademark "Log My Dance"
```

### ✅ v3

```
- [ ] P0 — Criar protótipos dos 5 fluxos-chave
- [ ] P0 — Testar protótipo com 5-10 dançarinos
- [ ] P0 — Pesquisar quais devices os beta testers usam
- [ ] P0 — Analisar DanceDay e Dance Journal (baixar e usar por 1 semana)
- [ ] P1 — Verificar disponibilidade do nome:
        - App Store search "Log My Dance"
        - Google Play search "Log My Dance"
        - Domínio logmydance.com / .app
        - Handles @logmydance em IG, TikTok, X
        - USPTO TESS, INPI, JPO
- [ ] P1 — Se disponível, reservar handles sociais (grátis)
- [ ] P2 — Registrar domínio (só após validar que o nome funciona)
```

**Razão:** não travar Sprint 0 por domínio. O Sprint 0 é sobre validar a ideia com pessoas reais, não sobre assets de marketing.

---

## CORREÇÃO 7: Lifetime Pro = Non-Consumable IAP

### ❌ v2

```
Lifetime Pro — $29.99 (non-consumable / lifetime subscription)
```

"Lifetime subscription" é um conceito confuso. Na prática:

### ✅ v3

```
PRODUTOS NO REVENUCAT:

1. Pro Lifetime
   Tipo: Non-Consumable IAP (iOS) / One-time product (Android)
   Preço: $29.99
   Entitlement: "pro"
   Descrição: "Unlock all Pro features forever"

2. Pro Annual (opcional, alternativa mais acessível)
   Tipo: Auto-Renewable Subscription
   Preço: $19.99/year
   Entitlement: "pro"
   Trial: 7 dias grátis
   Descrição: "All Pro features, billed annually"

3. Pro Monthly (ADIADO — só quando houver cloud/AI)
   Tipo: Auto-Renewable Subscription
   Preço: $3.99/month
   Entitlement: "pro_cloud" (entitlement diferente)
```

**Regras de implementação:**

```
- Lifetime e Annual concedem o MESMO entitlement "pro"
- Se user tem Lifetime, Annual não aparece
- Lifetime aparece como opção destacada no paywall
- Annual mostra economia vs Monthly (quando Monthly existir)
- Restore Purchases restaura qualquer um dos acima
- RevenueCat consolida: verificar customerInfo.entitlements["pro"].isActive
```

**Paywall text obrigatório (Apple):**

```
Para Annual:
"Payment will be charged to your Apple ID account at confirmation
of purchase. Subscription automatically renews unless it is canceled
at least 24 hours before the end of the current period. Your account
will be charged for renewal within 24 hours prior to the end of the
current period. You can manage and cancel your subscriptions by going
to your account settings on the App Store after purchase."

Para Lifetime:
"This is a one-time purchase. No subscription required."
```

---

## CORREÇÃO 8: Quality Gates de Store

### ❌ v2

```
Target API level conforme requisito do Google Play no momento da submissão
```

### ✅ v3

**Sprint 7 — Quality Gates de Store (explícitos):**

```
ANDROID:
✅ targetSdkVersion = requisito atual do Google Play (API 35+ desde ago/2025)
✅ Rodar `npx expo install --check` para validar dependências
✅ ProGuard habilitado em release build
✅ Data Safety Form completo no Google Play Console
✅ App bundle (.aab), não APK
✅ Testar em Android 10+ (API 29+) como minSdk

iOS:
✅ Privacy Nutrition Label preenchido em App Store Connect
✅ Privacy Policy URL configurada no metadata
✅ Subscription disclosure text no paywall (copy exato da Apple)
✅ Restore Purchases button acessível
✅ NSCameraUsageDescription / NSPhotoLibraryUsageDescription strings presentes
✅ Testar em iOS 16+ como deployment target
✅ Testar em iPhone SE (tela pequena) e iPad

AMBOS:
✅ Age rating: 4+
✅ Categoria: Health & Fitness ou Lifestyle
✅ Crash-free rate >99% nos últimos 7 dias
✅ Cold start <2s em device médio
```

---

## Schema Final Consolidado (v3)

```typescript
// ===== TABELAS MVP — VERSÃO FINAL =====

styles {
  id: integer PK autoincrement
  name: text NOT NULL
  icon: text                    // emoji
  is_custom: integer DEFAULT 0  // boolean (SQLite)
}

dance_entries {
  id: text PK                   // uuid
  date: text NOT NULL           // ISO date "2026-06-15"
  style_id: integer FK → styles.id
  instructor: text
  location: text
  duration_min: integer
  mood: text                    // "great" | "good" | "ok" | "tough"
  notes: text
  template_id: text FK → class_templates.id  // null se não veio de template
  created_at: text NOT NULL
  updated_at: text NOT NULL
}

movements {
  id: text PK                   // uuid
  name: text NOT NULL
  style_id: integer FK → styles.id
  status: text DEFAULT 'new'    // "new"|"learning"|"needs_practice"|"comfortable"|"mastered"
  notes: text
  created_at: text NOT NULL
  updated_at: text NOT NULL
}

entry_movements {
  entry_id: text FK → dance_entries.id ON DELETE CASCADE
  movement_id: text FK → movements.id ON DELETE CASCADE
  PRIMARY KEY (entry_id, movement_id)
}

tags {
  id: text PK                   // uuid
  name: text NOT NULL
  color: text                   // hex "#FF5733"
}

entry_tags {
  entry_id: text FK → dance_entries.id ON DELETE CASCADE
  tag_id: text FK → tags.id ON DELETE CASCADE
  PRIMARY KEY (entry_id, tag_id)
}

class_templates {
  id: text PK                   // uuid
  name: text NOT NULL           // "Bachata Monday @ Studio X"
  style_id: integer FK → styles.id
  instructor: text
  location: text
  default_duration: integer
  created_at: text NOT NULL
}

template_tags {
  template_id: text FK → class_templates.id ON DELETE CASCADE
  tag_id: text FK → tags.id ON DELETE CASCADE
  PRIMARY KEY (template_id, tag_id)
}

movement_progress {
  id: text PK                   // uuid
  movement_id: text FK → movements.id ON DELETE CASCADE
  entry_id: text FK → dance_entries.id ON DELETE SET NULL
  date: text NOT NULL
  old_status: text NOT NULL
  new_status: text NOT NULL
  note: text
}

media_assets {
  id: text PK                   // uuid
  owner_type: text NOT NULL     // "movement" (extensível para "entry" no futuro)
  owner_id: text NOT NULL       // FK lógico — ver regras de integridade abaixo
  kind: text NOT NULL           // "video" | "thumbnail"
  local_path: text NOT NULL
  original_filename: text
  size_bytes: integer
  mime_type: text               // "video/mp4", "image/jpeg"
  duration_ms: integer          // só vídeos
  width: integer
  height: integer
  status: text DEFAULT 'ready'  // "ready" | "missing" | "corrupted"
  created_at: text NOT NULL
}

// REGRAS DE INTEGRIDADE para media_assets:
//
// 1. Repository/service layer DEVE validar antes de INSERT:
//    - owner_type === "movement" (único valor no MVP)
//    - owner_id existe na tabela movements
//
// 2. Ao deletar um movement:
//    - PRIMEIRO deletar arquivos físicos (local_path) dos media_assets vinculados
//    - DEPOIS deletar rows de media_assets WHERE owner_id = movement.id
//    - DEPOIS deletar o movement
//    - Tudo dentro de uma transação SQLite
//
// 3. Helpers obrigatórios no MVP:
//    findOrphanMediaAssets() → media_assets onde owner_id não existe em movements
//    cleanupOrphanFiles() → deletar arquivos no DocumentDir sem media_asset correspondente
//    Rodar no app startup (silencioso) e no Storage Manager (botão manual)
//
// 4. Futuro: quando owner_type incluir "entry", adicionar validação para dance_entries

// ===== SCHEMA VERSION =====
// Guardar em tabela app_metadata no SQLite (não MMKV):

app_metadata {
  key: text PRIMARY KEY       // "schema_version", "backup_version_supported"
  value: text NOT NULL
}

// Seed inicial:
//   schema_version = "1"
//   backup_version_supported = "1"
//
// MMKV continua para: tema, idioma, onboarding_completed, app_opens_count
// Schema pertence ao banco porque backup/export/migrations dependem dele
```

---

## Lista Final de Libs (v3)

```
CORE
├── expo (SDK estável no momento do init — rodar npx expo install --check)
├── typescript (strict)
├── expo-router
├── drizzle-orm + expo-sqlite
├── react-native-mmkv
├── zustand
├── nativewind v4

UI
├── react-native-reanimated
├── react-native-gesture-handler
├── @shopify/flash-list
├── lucide-react-native
├── react-hook-form + zod

MÍDIA
├── expo-image-picker (import vídeo/foto)
├── expo-video (playback + generateThumbnailsAsync)
├── expo-file-system

EXPORT
├── react-native-zip-archive (criar/extrair .zip)
├── expo-sharing (share sheet)

MONETIZAÇÃO (pós-validação)
├── react-native-purchases (RevenueCat)

i18n
├── i18next + react-i18next
├── date-fns

CRASH REPORTING (só crash/error)
├── @sentry/react-native

DEVTOOLS
├── eslint + prettier
├── husky + lint-staged
├── eas build + submit
```

```
REMOVIDO DEFINITIVAMENTE DO MVP:
❌ expo-video-thumbnails (deprecated)
❌ react-native-vision-camera
❌ react-native-compressor (avaliar pós-beta)
❌ jail-monkey
❌ react-native-ssl-pinning
❌ expo-secure-store
❌ expo-local-authentication
❌ expo-notifications
❌ posthog-react-native / mixpanel
❌ victory-native / skia charts
```

---

## Timeline Revisada (Realista para Dev Solo)

| Sprint | Semanas | Conteúdo |
|---|---|---|
| 0 — Validação | 1-2 | Protótipo, feedback, análise de competidores |
| 1 — Core | 3-5 | Setup, CRUD entradas, templates, tags, design system |
| 2 — Biblioteca + Vídeo | 6-8 | Movimentos, media_assets, import, player, status |
| 3 — Storage + Export | 9-10 | Storage manager, backup zip, import/restore |
| 4 — Stats + Polish | 11-12 | Stats, onboarding, i18n, Sentry (crash only) |
| 5 — Beta | 13-14 | Distribuir, medir retenção manual, iterar |
| 6 — Monetização | 15-16 | RevenueCat, paywall, non-consumable IAP (CONDICIONAL) |
| 7 — Launch | 17-18 | Store listings, compliance, submissão |
| **Total** | **~18 semanas** | Dev solo, sem cutting corners |

---

*Roadmap v3.1 — Maio 2026*
*11 correções aplicadas (8 na v3 + 3 na v3.1)*
*Review score: 8.7/10*
*Status: aprovado para implementação*

---

## Ajustes v3.1 (este patch)

| # | Ajuste | O que mudou |
|---|---|---|
| 9 | `schema_version` em SQLite | Criada tabela `app_metadata` no banco, MMKV só para UI prefs |
| 10 | Integridade de `media_assets` | Regras de validação no repository, helpers de orphan cleanup, delete transacional |
| 11 | ZIP fallback | Nota de rebuild nativo + fallback JSON-only se ZIP falhar no beta |
| — | Thumbnail detail | `VideoPlayer.generateThumbnailsAsync([time])`, salvar em DocumentDir |
| — | Linguagem | Docs de implementação em inglês, este doc PT-BR é referência de produto |
