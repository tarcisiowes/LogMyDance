import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { zip } from 'react-native-zip-archive';
import { stripScheme, basename } from '@/services/backup/types';
import type { SequenceClipSource } from '@/components/sequence/SequencePlayer';

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

/**
 * Phase 1 export: bundles the sequence's clips (in order) + a manifest into a
 * .zip and opens the share sheet. A single concatenated .mp4 is phase 2
 * (needs ffmpeg / server-side rendering — expo-video cannot concatenate).
 */
export async function exportSequence(
  name: string,
  clips: SequenceClipSource[]
): Promise<void> {
  if (clips.length === 0) return;

  const stagingDir = `${FileSystem.documentDirectory}sequence_tmp/`;
  await FileSystem.deleteAsync(stagingDir, { idempotent: true });
  await FileSystem.makeDirectoryAsync(stagingDir, { intermediates: true });

  try {
    const manifestClips: { position: number; name: string; filename: string }[] = [];
    let pos = 1;
    for (const clip of clips) {
      const info = await FileSystem.getInfoAsync(clip.videoPath);
      if (!info.exists) continue;
      const ext = basename(clip.videoPath).split('.').pop() || 'mp4';
      const filename = `${String(pos).padStart(2, '0')}_${slugify(clip.name)}.${ext}`;
      await FileSystem.copyAsync({ from: clip.videoPath, to: `${stagingDir}${filename}` });
      manifestClips.push({ position: pos, name: clip.name, filename });
      pos += 1;
    }

    await FileSystem.writeAsStringAsync(
      `${stagingDir}sequence.json`,
      JSON.stringify({ app: 'Log My Dance', kind: 'sequence', name, clips: manifestClips }, null, 2)
    );

    const zipTarget = `${FileSystem.documentDirectory}sequence-${slugify(name)}.zip`;
    await FileSystem.deleteAsync(zipTarget, { idempotent: true });
    await zip(stripScheme(stagingDir), stripScheme(zipTarget));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(zipTarget, {
        mimeType: 'application/zip',
        dialogTitle: 'Export sequence',
        UTI: 'public.zip-archive',
      });
    }
  } finally {
    await FileSystem.deleteAsync(stagingDir, { idempotent: true });
  }
}
