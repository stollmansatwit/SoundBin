import { useEffect, useMemo, useState } from "react";
import { type Track, type Album } from "../../types";
import SongPopUp from "../popUpPage/SongPopUp";

const API_BASE_URL = "http://localhost:3000"; // Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`

type CombinedItem = {
  track: Track;
  album: Album;
  trackDuration: string;
  artist_id: number | null;
  artistName: string;
};

export function SongsTable() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artistNames, setArtistNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CombinedItem | null>(null);
  

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  };

  // Fetch albums + tracks
  useEffect(() => {
    const fetchAlbums = fetch(`${API_BASE_URL}/api/album-path`).then((response) => {
      if (!response.ok) {
        throw new Error(`Album request failed with status ${response.status}`);
      }
      return response.json() as Promise<Album[]>;
    });

    const fetchTracks = fetch(`${API_BASE_URL}/api/tracks`).then((response) => {
      if (!response.ok) {
        throw new Error(`Track request failed with status ${response.status}`);
      }
      return response.json() as Promise<Track[]>;
    });

    Promise.all([fetchAlbums, fetchTracks])
      .then(([albumData, trackData]) => {
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

  // Fetch artist names for every unique artist_id found on albums
  useEffect(() => {
    if (albums.length === 0) return;

    const uniqueArtistIds = [
      ...new Set(albums.map((a) => a.artist_id).filter((id): id is number => id !== null)),
    ];

    if (uniqueArtistIds.length === 0) return;

    Promise.all(
      uniqueArtistIds.map((id) =>
        fetch(`${API_BASE_URL}/api/artist-name?id=${id}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Artist name request failed with status ${response.status}`);
            }
            return response.json() as Promise<{ name: string }>;
          })
          .then((data) => [id, data.name] as const)
      )
    )
      .then((entries) => {
        setArtistNames(Object.fromEntries(entries));
      })
      .catch((error) => {
        console.error("Failed to fetch artist names:", error);
      });
  }, [albums]);

  // Resolve each track to its album + artist name
  const combinedItems: CombinedItem[] = useMemo(() => {
  return tracks
    .map((track) => {
      const album = albums.find((a) => a.album_id === track.album_id);
      if (!album) return null;

      return {
        track,
        album,
        trackDuration: formatDuration(track.duration),
        artist_id: album.artist_id,
        artistName: album.artist_id !== null ? artistNames[album.artist_id] ?? "" : "",
      };
    })
    .filter((item): item is CombinedItem => item !== null);
}, [tracks, albums, artistNames]);

  if (loading) {
    return <p className="text-center text-white">Loading...</p>;
  }

  return (
    <>
    <div className="max-h-105 overflow-auto rounded-lg">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="sticky top-0 bg-white/95 text-xs font-bold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Artist</th>
            <th className="hidden px-3 py-2 sm:table-cell">Album</th>
            <th className="px-3 py-2 text-right">Duration</th>
          </tr>
        </thead>
        <tbody>
          {combinedItems.map((item) => (
            <tr
              key={item.track.track_id}
              className="border-t border-gray-200 hover:bg-white/80"
              onClick={() => setSelectedItem(item)}
            >
              <td className="px-3 py-2.5 font-bold text-gray-900 max-w-[40vw] truncate sm:max-w-none">{item.track.title}</td>
              <td className="px-3 py-2.5 font-normal text-gray-600 max-w-[28vw] truncate sm:max-w-none">{item.artistName}</td>
              <td className="hidden px-3 py-2.5 font-normal text-gray-600 sm:table-cell">{item.album.title}</td>
              <td className="px-3 py-2.5 text-right font-normal text-gray-500">{item.trackDuration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
          {selectedItem && (
            <SongPopUp
              album_id={selectedItem.album.album_id}
              track={{ title: selectedItem.track.title, track_id: selectedItem.track.track_id, album_id: selectedItem.album.album_id, duration: tracks.find(track => track.track_id === selectedItem.track.track_id)?.duration || 0 }}
              onClose={() => setSelectedItem(null)}
            />
          )}
    </>
  )
}