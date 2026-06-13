# 02 — Start-from-template flow in new entry

**Date:** 2026-06-13
**Status:** ✅ Done (typecheck passes)

## What was done
Templates could be created/edited but never *used*. Added an apply flow so a
recurring class can be logged in two taps.

- New entry screen loads all templates (`templatesRepo.getAll`).
- "Start from template" horizontal selector at the top (only shown if ≥1 template).
- Tapping a template prefills: style, instructor, location, default duration, and
  default tags (`templatesRepo.getTagIds`). The date field is preserved.
- Selected `templateId` is stored on the entry (`dance_entries.template_id`) so the
  link survives — re-tapping the active template clears the selection.
- Prefill uses react-hook-form `reset` + `getValues('date')` to keep today's date.

## Files touched
- `app/entry/new.tsx` — template state, selector UI, `applyTemplate`, submit passes
  `templateId`.

## Dependencies
- None new.

## Blockers
- None.

## Manual actions required
- None. Verify: create a template (Templates tab) → New entry → tap it → fields
  populate → save → entry persists `template_id`.

## Notes / follow-ups
- Template tags are copied into the tag selection, not auto-locked — user can edit.
- Future: surface a "Use" shortcut directly on `TemplateCard` that deep-links to
  `/entry/new` with the template preselected (currently selection happens in-screen).
