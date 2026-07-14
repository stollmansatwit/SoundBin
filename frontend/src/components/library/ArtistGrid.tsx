import { useEffect, useState } from "react"

type Album = {
  album_id: string;
  artist_id: string;
  title: string;
  release_date?: any;
  cover_art_url?: string;
};

type Track = {
  title: string;
  duration: number;
  albumSequence?: {sequence_number: number}[];
}

interface Props {
  album: Album;
  onClose: () => void;
}

export function ArtistGrid({ album, onClose }: Props) {
  const [songs, setSongs] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [artistName, setArtistName] = useState<string>("");

  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  useEffect(() => {
    if (!album?.album_id) return;
    setLoadingTracks(true);
    fetch(`${apiBaseUrl}/api/album-track-list?id=${album.album_id}`)
      .then((res) => res.json())
      .then((data: Track[] = []) => {
        setSongs(data);
        setLoadingTracks(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tracks:", err);
        setLoadingTracks(false)
      });

      // Fetch artist name if artist_id exists
    if (album.artist_id) {
      fetch(`${apiBaseUrl}/api/artist-name?id=${album.artist_id}`)
        .then((res) => res.json())
        .then((data: any) => {
          // Assuming the response is { name: "Artist Name" } or similar
          setArtistName(data.name || "Unknown Artist");
        })
        .catch(err => console.error("Failed to fetch artist:", err));
    }
  }, [album?.album_id]);





    
  // TODO: replace MOCK_ARTISTS with data fetched from the library API
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">

      {artistName && (
        <h2 className="col-span-full text-lg font-bold text-gray-900">{artistName}</h2>
      )}
      {songs.map((artist) => (
        <button
          key={artist.title}
          className="group flex flex-col items-center text-center rounded-lg p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 focus-visible:outline-offset-2"
        >
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br ${artistName} text-white shadow-md transition-transform duration-200 group-hover:scale-105`}
          >
            
          </div>
          <p className="mt-2 truncate text-sm font-bold text-gray-900">{artist.title}</p>
          <p className="text-xs font-normal text-gray-500">{} albums</p>
        </button>
      ))}
    </div>
  )
}