import { useEffect, useState } from "react"
import PlaylistPopUp from "../popUpPage/PlaylistPopUp"
import { type Playlist } from "../../types"

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

export function PlaylistGrid() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/playlists`)
      .then((response) => {
        if (!response.ok) {
          console.log(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Playlist[]) => {
        setPlaylists(data);
      })
      .catch((error) => {
        console.error("Failed to fetch playlists:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getCoverImage = (path?: string) => {
    if (!path || path == "" || path == null) {
      return DEFAULT_IMAGE;
    }
    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  if (loading) {
    return <p className="text-center text-white">Loading...</p>;
  }

  if (playlists.length === 0) {
    return <p className="text-center text-gray-500 italic">No playlists yet. Create one with the "+ New Playlist" button above.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((playlist) => (
          <button
            key={playlist.playlist_id}
            onClick={() => setSelectedPlaylist(playlist)}
            className="group flex items-center gap-4 rounded-lg bg-gray-800/60 hover:bg-gray-800 p-4 text-left shadow-md transition-transform duration-200 hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-700 focus-visible:outline-offset-2"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-white/20">
              <img
                src={getCoverImage(playlist.cover_art_url)}
                alt={playlist.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{playlist.name}</p>
              <p className="text-xs font-normal text-white/60 truncate">{playlist.source_type === 'manual' ? 'Playlist' : playlist.source_type}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedPlaylist && (
        <PlaylistPopUp
          playlist={selectedPlaylist}
          onClose={() => setSelectedPlaylist(null)}
          onDeleted={() => setPlaylists((prev) => prev.filter((p) => p.playlist_id !== selectedPlaylist.playlist_id))}
        />
      )}
    </>
  )
}
