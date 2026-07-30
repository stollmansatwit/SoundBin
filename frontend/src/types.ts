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
  title: string;
  artist?: string;
  release_date?: any;
  duration?: number;
  cover_art_url?: string;
  files?: {storage_path_url: string}[];
  albumSequence?: {sequence_number: number}[];
  genres?: { genre: Genre }[];
  contributors?: { artist: { artist_id: number; name: string }; role?: string | null }[];
}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Genre Types
 */
export type Genre = {
  genre_id: number;
  name: string;
}

export type TrackData = {
  track_id: number;
  album_id: number;
  artist_id: number | null;
  index: number;
}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Listening Activity Types
 */
export type RecentListen = {
  activity_id: number;
  played_at: string;
  duration_played: number | null;
  track_id: number;
  title: string;
  duration?: number;
  cover_art_url?: string | null;
  album_id: number | null;
  album_title?: string | null;
};

export type TopTrack = {
  track_id: number;
  title: string;
  album_title?: string | null;
  cover_art_url?: string | null;
  play_count: number;
};

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Artist Types
 */
export type Artist = {
  artist_id: number;
  name:      string;
  bio?:       string;
  image_url?: string;
}

/** ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Playlist Types
 */
export type Playlist = {
  playlist_id: number;
  user_id: number;
  name: string;
  description?: string;
  source_type: string
  date_created: any;
  cover_art_url?: string;
}

export type PlaylistItem = {
  playlist_item_id: number;
  playlist_item: number;
  track_id: number;
  sequence_number: number;
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
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (tracks: Track[]) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => Promise<void>; // Play from current queue index or next if ended
  removeFromQueue: (index: number) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  playTrackAt: (index: number) => Promise<void>;
  playPrevious: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
};

export interface AudioEngineOptions {
  getTrackUrl: (storage_path_url: string) => string | Promise<string | null>;
}