export type Mood = 'great' | 'good' | 'ok' | 'tough';
export type MovementStatus = 'new' | 'learning' | 'needs_practice' | 'comfortable' | 'mastered';
export type MediaKind = 'video' | 'thumbnail';
export type MediaStatus = 'ready' | 'missing' | 'corrupted';

export interface Style {
  id: number;
  name: string;
  icon: string | null;
  isCustom: number;
}

export interface DanceEntry {
  id: string;
  date: string;
  styleId: number | null;
  instructor: string | null;
  location: string | null;
  durationMin: number | null;
  mood: Mood | null;
  notes: string | null;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  name: string;
  styleId: number | null;
  status: MovementStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export interface ClassTemplate {
  id: string;
  name: string;
  styleId: number | null;
  instructor: string | null;
  location: string | null;
  defaultDuration: number | null;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  ownerType: string;
  ownerId: string;
  kind: MediaKind;
  localPath: string;
  originalFilename: string | null;
  sizeBytes: number | null;
  mimeType: string | null;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  status: MediaStatus;
  createdAt: string;
}

export interface MovementProgress {
  id: string;
  movementId: string;
  entryId: string | null;
  date: string;
  oldStatus: MovementStatus;
  newStatus: MovementStatus;
  note: string | null;
}
