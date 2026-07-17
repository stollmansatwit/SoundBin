import { useEffect, useState } from "react"
import SongPopUp from "../popUpPage/SongPopUp";
import { type Track } from "../../types";
import AlbumPopUp from "../popUpPage/AlbumPopUp";

type Album = {
  album_id: number;
  artist_id: number | null;
  title: string;
  cover_art_url?: string;
};

type Artist = {
  artist_id: number;
  name: string;
};



type CombinedItem = {
  album: Album;
  trackTitle: string;
  track_id: number;
  artist: Artist;
  trackDuration: string;
};

// const MOCK_SONGS: Track[] = [
//   { id: '1', title: 'Amber Static', artist: 'Marlow Reed', album: 'Nightcolors', duration: '3:24' },
//   { id: '2', title: 'Slow Fade', artist: 'The Quiet Hours', album: 'Static Bloom', duration: '4:02' },
//   { id: '3', title: 'Undertow', artist: 'Coastal Drift', album: 'Low Tide', duration: '2:57' },
//   { id: '4', title: 'Cardboard Sky', artist: 'June Arcade', album: 'Paper Planets', duration: '3:41' },
//   { id: '5', title: 'Copper Line', artist: 'Marlow Reed', album: 'Rust & Gold', duration: '3:15' },
// ]

export function SongsTable() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);

    const formatDuration = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      return `${minutes}:${remainder.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
      const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
  
      const fetchAlbums = fetch(`${apiBaseUrl}/api/album-path`).then((response) => {
        if (!response.ok) {
          throw new Error(`Album request failed with status ${response.status}`);
        }
        return response.json() as Promise<Album[]>;
      });
  
      const fetchTracks = fetch(`${apiBaseUrl}/api/tracks`).then((response) => {
        if (!response.ok) {
          throw new Error(`Track request failed with status ${response.status}`);
        }
        return response.json() as Promise<Track[]>;
      });

      Promise.all([fetchAlbums, fetchTracks])
        .then(async ([albumData, trackData]) => {
          const uniqueArtistIds = Array.from(
            new Set(albumData.map((album) => album.artist_id).filter((artistId): artistId is number => artistId !== null)),
          );

          const artistResults = await Promise.all(
            uniqueArtistIds.map(async (artistId) => {
              const response = await fetch(`${apiBaseUrl}/api/artist-name?id=${artistId}`);
              if (!response.ok) {
                throw new Error(`Artist request failed with status ${response.status}`);
              }

              const data = await response.json() as { name?: string };
              return { artist_id: artistId, name: data.name || '' };
            }),
          );

          setAlbums(albumData);
          setTracks(trackData);
          
        })
        .catch((error) => {
          console.error("Failed to fetch library data:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }, []);
  
    useEffect(() => {
      const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
  
      const fetchArtists = fetch(`${apiBaseUrl}/api/artist-name`).then((response) => {
        if (!response.ok) {
          throw new Error(`Artist request failed with status ${response.status}`);
        }
        console.log(response.json());
        return response.json() as Promise<Artist[]>;
      }
      );
      fetchArtists
        .then((artistData) => {
          setArtists(artistData);
        })
        .catch((error) => {
          console.error("Failed to fetch artists:", error, artists);
        });
    }, []);
  

  
  
    const combinedItems: CombinedItem[] = tracks.map((track) => {
      const album = albums.find((candidate) => candidate.album_id === track.album_id) || {
        album_id: 0,
        artist_id: null,
        title: '',
        cover_art_url: undefined,
      };

      const artist = album.artist_id
        ? artists.find((candidate) => candidate.artist_id === album.artist_id) || { artist_id: album.artist_id, name: '' }
        : { artist_id: 0, name: '' };

      return {
        album,
        trackTitle: track.title,
        track_id: track.track_id,
        artist: artist.name ? artist : { artist_id: 0, name: 'Unknown Artist' },
        trackDuration: formatDuration(track.duration)

      };
    });
  

  if (loading) {
    return <p className="text-center text-white">Loading...</p>;
  }

  return (
    <div className="max-h-105 overflow-y-auto rounded-lg">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white/95 text-xs font-bold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Artist</th>
            <th className="px-3 py-2">Album</th>
            <th className="px-3 py-2 text-right">Duration</th>
          </tr>
        </thead>
        <tbody>
          {combinedItems.map((item) => (
            <tr key={item.track_id} className="border-t border-gray-200 hover:bg-white/80" onClick={() => console.log("hi")}>
              <td className="px-3 py-2.5 font-bold text-gray-900">{item.trackTitle}</td>
              <td className="px-3 py-2.5 font-normal text-gray-600">{item.artist.name}</td>
              <td className="px-3 py-2.5 font-normal text-gray-600">{item.album.title}</td>
              <td className="px-3 py-2.5 text-right font-normal text-gray-500">{item.trackDuration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}