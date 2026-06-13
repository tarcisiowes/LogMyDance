# src/components/ — UI components

NativeWind (Tailwind classes via `className`). Dark theme only: `bg-neutral-900/950`, borders `neutral-800`, text `neutral-100/400/500`, accent `violet-600`, amber for step pulses.

- `ui/` — primitives: `Button` (variants primary/secondary/ghost/danger, sizes), `Card`, `Input`, `Badge`, `TagChip`, `EmptyState`. Reuse these; don't re-roll buttons/inputs.
- `entries/`, `movements/`, `templates/`, `attributes/`, `sequence/` — feature components.

## Conventions
- Text via `useTranslation()`; no hardcoded copy.
- `lucide-react-native` icons take `color`/`size` props — **not** `className` (wrap in a `View` for margins).
- Video uses `expo-video` (`useVideoPlayer` + `VideoView`, `nativeControls={false}` + custom controls). Events via `player.addListener('playingChange'|'timeUpdate'|'playToEnd', …)`; sequential playback swaps source with `player.replaceAsync`.
- No native Slider dep — `sequence/BpmControl.tsx` builds a slider from `Pressable` + layout math. Follow that if you need another slider.
- Enum labels (mood/status/attributes) → translate with helpers in `src/i18n/labels.ts`, never the raw constant `label`.
