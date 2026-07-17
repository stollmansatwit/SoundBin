// create Album type
export type Album = {
  album_id: number;
  artist_id: number | null;
  title: string;
  release_date?: any;
  cover_art_url?: string;
};


export type Track = {
  track_id: number;
  title: string;
  duration: number;
  files?: {storage_path_url: string};
  albumSequence?: {sequence_number: number}[];
  album_id: number;
}

