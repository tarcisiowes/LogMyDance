import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { createVideoPlayer } from 'expo-video';
import {
  mediaRepo,
  ensureMediaDirs,
  videoPath,
  thumbPath,
} from '@/repositories/media';
import { captureError } from '@/services/sentry';
import { newUUID } from '@/utils/uuid';

export type VideoSource = 'camera' | 'library' | 'files';

export interface PickedVideo {
  uri: string;
  fileName?: string;
  sizeBytes?: number;
  durationMs?: number;
  width?: number;
  height?: number;
}

export type PickVideoResult =
  | { ok: true; video: PickedVideo }
  | { ok: false; reason: 'canceled' | 'permission-camera' | 'permission-library' };

type Db = Parameters<typeof mediaRepo>[0];

/** Picks a video from one of three sources. Handles permissions; the camera
 *  source also saves the recording to the device gallery (best-effort). */
export async function pickVideo(source: VideoSource): Promise<PickVideoResult> {
  if (source === 'camera') return pickFromCamera();
  if (source === 'files') return pickFromFiles();
  return pickFromLibrary();
}

async function pickFromCamera(): Promise<PickVideoResult> {
  const cam = await ImagePicker.requestCameraPermissionsAsync();
  if (!cam.granted) return { ok: false, reason: 'permission-camera' };

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return { ok: false, reason: 'canceled' };
  const asset = result.assets[0];

  // Keep the recording on the device too, like a normal camera capture.
  await saveToGallery(asset.uri);

  return { ok: true, video: normalizeAsset(asset) };
}

async function pickFromLibrary(): Promise<PickVideoResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, reason: 'permission-library' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return { ok: false, reason: 'canceled' };
  return { ok: true, video: normalizeAsset(result.assets[0]) };
}

async function pickFromFiles(): Promise<PickVideoResult> {
  // System file browser (SAF on Android) — reaches Downloads and other folders,
  // not only the camera roll that the media library picker is limited to.
  const res = await DocumentPicker.getDocumentAsync({
    type: 'video/*',
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.[0]) return { ok: false, reason: 'canceled' };
  const a = res.assets[0];
  return {
    ok: true,
    video: { uri: a.uri, fileName: a.name ?? undefined, sizeBytes: a.size ?? undefined },
  };
}

function normalizeAsset(asset: ImagePicker.ImagePickerAsset): PickedVideo {
  return {
    uri: asset.uri,
    fileName: asset.fileName ?? undefined,
    sizeBytes: asset.fileSize ?? undefined,
    durationMs: asset.duration ? Math.round(asset.duration) : undefined,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
  };
}

async function saveToGallery(uri: string): Promise<void> {
  try {
    const perm = await MediaLibrary.requestPermissionsAsync(true); // write-only
    if (!perm.granted) return;
    await MediaLibrary.saveToLibraryAsync(uri);
  } catch (e) {
    // Non-fatal: the video still imports into the app even if the gallery
    // save fails or is denied.
    captureError(e, 'gallery_save_failed');
  }
}

/**
 * Copies the picked video into app storage, replaces any existing video for the
 * movement, writes the media row, and generates a thumbnail. Shared by the
 * movement detail screen (immediate) and the new-movement screen (on save).
 */
export async function importVideoForMovement(
  db: Db,
  movementId: string,
  picked: PickedVideo
): Promise<void> {
  await ensureMediaDirs();
  const videoId = newUUID();
  const dest = videoPath(videoId);

  await FileSystem.copyAsync({ from: picked.uri, to: dest });
  const info = await FileSystem.getInfoAsync(dest);

  const repo = mediaRepo(db);
  await repo.deleteForMovement(movementId); // replace prior video + thumbnail if any

  await repo.createVideoAsset({
    movementId,
    localPath: dest,
    originalFilename: picked.fileName,
    sizeBytes: info.exists ? info.size : picked.sizeBytes,
    durationMs: picked.durationMs,
    width: picked.width,
    height: picked.height,
  });

  await generateAndSaveThumbnail(dest, videoId, movementId, db);
}

async function generateAndSaveThumbnail(
  videoUri: string,
  videoId: string,
  movementId: string,
  db: Db
): Promise<void> {
  let tempPlayer: ReturnType<typeof createVideoPlayer> | null = null;
  try {
    tempPlayer = createVideoPlayer(videoUri);
    const thumbnails = await tempPlayer.generateThumbnailsAsync([0]);
    if (!thumbnails.length) return;

    const thumbnail = thumbnails[0];
    const destThumbPath = thumbPath(videoId);

    const saved = await ImageManipulator.manipulateAsync(
      thumbnail as any,
      [],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: false }
    );

    await FileSystem.copyAsync({ from: saved.uri, to: destThumbPath });

    await mediaRepo(db).createThumbnailAsset({
      movementId,
      localPath: destThumbPath,
      width: thumbnail.width,
      height: thumbnail.height,
    });
  } catch (err) {
    // Thumbnail generation failed silently — video still works.
    captureError(err, 'video_thumbnail_failed');
  } finally {
    tempPlayer?.release?.();
  }
}
