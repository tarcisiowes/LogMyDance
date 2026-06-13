import * as FileSystem from 'expo-file-system/legacy';
import { stripScheme } from '@/services/backup/types';
import type { SequenceClipSource } from '@/components/sequence/SequencePlayer';

/**
 * Phase 2: concatenate a sequence's clips into a single .mp4 using FFmpegKit.
 *
 * The native module ships separately (supply-chain reasons — it bundles a
 * re-hosted FFmpeg binary). Install it, then rebuild the native app:
 *   npm install ffmpeg-kit-react-native-community
 *   npx expo run:android   # (and run:ios)
 * Until then `isConcatAvailable()` returns false and the UI hides/blocks the
 * action — the rest of the app builds and runs normally.
 *
 * The package name is held in a `string`-typed const so TypeScript does not try
 * to resolve the (optional) module at build time.
 */
const FFMPEG_PKG: string = 'ffmpeg-kit-react-native-community';

type FFmpegSession = { getReturnCode(): Promise<unknown> };
type FFmpegKitModule = {
  FFmpegKit: { execute(command: string): Promise<FFmpegSession> };
  ReturnCode: { isSuccess(rc: unknown): boolean };
};

function loadFFmpeg(): FFmpegKitModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(FFMPEG_PKG) as FFmpegKitModule;
  } catch {
    return null;
  }
}

export function isConcatAvailable(): boolean {
  return loadFFmpeg() !== null;
}

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'sequence'
  );
}

// Uniform output canvas. Clips are scaled to fit and padded (letterbox) so
// mixed source resolutions/orientations concatenate cleanly.
const TARGET_W = 720;
const TARGET_H = 1280;

/**
 * Builds and runs a single FFmpeg concat-filter command (re-encode). Uses the
 * built-in mpeg4 + aac encoders so the default LGPL FFmpeg build is enough (no
 * GPL x264). NOTE: assumes every clip has an audio stream; clips with no audio
 * need ffprobe-based handling (see handoff — known limitation).
 *
 * Returns the file:// uri of the produced .mp4.
 */
export async function concatSequenceToMp4(
  name: string,
  clips: SequenceClipSource[]
): Promise<string> {
  const mod = loadFFmpeg();
  if (!mod) throw new Error('FFmpeg native module not installed');
  if (clips.length === 0) throw new Error('No clips to merge');

  const out = `${FileSystem.documentDirectory}sequence-${slugify(name)}.mp4`;
  await FileSystem.deleteAsync(out, { idempotent: true });

  const inputs = clips.map((c) => `-i "${stripScheme(c.videoPath)}"`).join(' ');
  const n = clips.length;

  let filter = '';
  for (let i = 0; i < n; i += 1) {
    filter +=
      `[${i}:v]scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease,` +
      `pad=${TARGET_W}:${TARGET_H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}];` +
      `[${i}:a]aresample=async=1:first_pts=0[a${i}];`;
  }
  for (let i = 0; i < n; i += 1) filter += `[v${i}][a${i}]`;
  filter += `concat=n=${n}:v=1:a=1[v][a]`;

  const cmd =
    `${inputs} -filter_complex "${filter}" -map "[v]" -map "[a]" ` +
    `-c:v mpeg4 -q:v 5 -c:a aac -movflags +faststart -y "${stripScheme(out)}"`;

  const session = await mod.FFmpegKit.execute(cmd);
  const rc = await session.getReturnCode();
  if (!mod.ReturnCode.isSuccess(rc)) {
    throw new Error('FFmpeg concat failed');
  }
  return out;
}
