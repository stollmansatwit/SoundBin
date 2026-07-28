import { useEffect, useState } from "react";
import PlaylistPopUp from "../../popUpPage/PlaylistPopUp";
import type { Playlist } from "../../../types";

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

type ArtistPlaylistsProps = {
  artistId: number;
};

export function ScrollableArtistPlaylist({ artistId }: ArtistPlaylistsProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  useEffect(() => {
    if (!artistId) return;

    setLoading(true);
    fetch(`${apiBaseUrl}/api/artist-playlists?artistID=${artistId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json() as Promise<Playlist[]>;
      })
      .then((data) => {
        setPlaylists(data);
      })
      .catch((error) => {
        console.error("Failed to fetch artist playlists:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [artistId]);

  const getCoverImage = (path?: string) => {
    if (!path || path == "" || path == null) { return DEFAULT_IMAGE; }
    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  if (loading) {
    return <p className="text-gray-500 italic">Loading playlists...</p>;
  }

  if (playlists.length === 0) {
    return (
      <div className="bg-gray-800/50 p-4 rounded-lg text-gray-500 italic">
        Not featured in any playlists yet.
      </div>
    );
  }

  return (
    <>
      <div className="relative flex items-center scrollbar-thumb-black scrollbar-auto scrollbar ease-in duration-75 shadow-lg">
        <li className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth p-1">
          <div id="slider"></div>
          {playlists.map((playlist) => (
            <div
              key={playlist.playlist_id}
              onClick={() => setSelectedPlaylist(playlist)}
              className="inline-block p-2 cursor-pointer transition-transform ease-linear hover:scale-105 flex flex-col items-center"
            >
              <div className="w-40 h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 overflow-hidden rounded-lg">
                <img
                  className="w-full h-full object-cover cursor-pointer transition-transform ease-linear duration-[300ms]"
                  src={getCoverImage(playlist.cover_art_url)}
                  alt={playlist.name}
                />
              </div>
              <p className="text-white text-center mt-2 text-sm lg:text-base truncate max-w-[160px] lg:max-w-[192px] xl:max-w-[224px]">
                {playlist.name}
              </p>
            </div>
          ))}
        </li>
      </div>

      {selectedPlaylist && (
        <PlaylistPopUp
          playlist={selectedPlaylist}
          onClose={() => setSelectedPlaylist(null)}
          onDeleted={() => setPlaylists((prev) => prev.filter((p) => p.playlist_id !== selectedPlaylist.playlist_id))}
        />
      )}
    </>
  );
}
