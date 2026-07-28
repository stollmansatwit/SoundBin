import { useEffect, useState } from 'react'
import type { Album } from '../../types';

const API_BASE_URL = "http://localhost:3000";

type CombinedItem = {
  artist_id: number;
  artistName: string;
  albumCount: number;
};


export function ArtistGrid() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artistNames, setArtistNames] = useState<Record<number, string>>({});


  useEffect(() => {
    const fetchAlbums = fetch(`${API_BASE_URL}/api/album-path`).then((response) => {
      if (!response.ok) {
        throw new Error(`Album request failed with status ${response.status}`);
      }
      return response.json() as Promise<Album[]>;
    });

    Promise.all([fetchAlbums])
      .then(([albumData]) => {
        setAlbums(albumData);
      })
      .catch((error) => {
        console.error("Failed to fetch library data:", error);
      })
      .finally(() => {

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
  // Resolve each artist_id to its artist name + album count
  const combinedItems: CombinedItem[] = Object.entries(
    albums.reduce<Record<number, { artist_id: number; count: number }>>((acc, album) => {
      if (album.artist_id === null) return acc;
      if (!acc[album.artist_id]) {
        acc[album.artist_id] = { artist_id: album.artist_id, count: 0 };
      }
      acc[album.artist_id].count += 1;
      return acc;
    }, {})
  ).map(([artistIdStr, { count }]) => {
    const artist_id = Number(artistIdStr);
    return {
      artist_id,
      artistName: artistNames[artist_id] ?? 'Unknown Artist',
      albumCount: count,
    };
  });
  // TODO: replace MOCK_ARTISTS with data fetched from the library API
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {combinedItems.map((item) => (
        <button
          key={item.artist_id}
          className="group flex flex-col items-center text-center rounded-lg p-2 border-2 border-gray-200 hover:border-orange-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 focus-visible:outline-offset-2" 
        >
          <p className="mt-2 truncate text-sm font-bold text-gray-900">{item.artistName}</p>
          <p className="text-xs font-normal text-gray-500">{item.albumCount} album</p>
        </button>
      ))}
    </div>
  )
}