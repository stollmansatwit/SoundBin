/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Album Types
 */

export type Album = {
  album_id: number;
  artist_id: number | null;
  title: string;
  release_date?: any;
  cover_art_url?: string;
};

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Track Types
 */
export type Track = {
  track_id: number;
  album_id: number;
  title?: string;
  artist?: string;
  duration?: number;
  cover_art_url?: string;
  files?: {storage_path_url: string}[];
  albumSequence?: {sequence_number: number}[];
}

export type TrackData = {
  track_id: number;
  album_id: number;
  artist_id: number | null;
  index: number;
}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Artist Types
 */
export type ArtistData = {
  name: string;
}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Audio Engine Types
 */
export interface AudioState {
  isPlaying: boolean;
  hasQueue: boolean;
  currentTrackId: number | null;
  currentTime: number;
  duration: number;
  error: string | null;
  currentTrackMetadata: Track | null;
}

export type RepeatMode = 'off' | 'all' | 'one';


// Extended state for queue and modes
export interface AudioEngineState extends AudioState {
  currentQueue: Track[]; // The actual tracks in queue
  queueIndex: number; // Current position in the queue
  shuffleMode: boolean;
  repeatMode: RepeatMode;
  currentTitle?: string;
  currentArtist?: string;
  currentArtUrl?: string;
}

// Type for the context/provider to expose
export type AudioContextType = AudioEngineState & {
  setQueue: (tracks: Track[]) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => Promise<void>; // Play from current queue index or next if ended
  playPrevious: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
};

export interface AudioEngineOptions {
  getTrackUrl: (storage_path_url: string) => string | Promise<string | null>;
}