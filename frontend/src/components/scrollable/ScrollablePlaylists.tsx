import React, { useEffect, useState } from "react";

import PlaylistPopUp from "../popUpPage/PlaylistPopUp";
import type { Playlist } from "../../types";

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

export function ScrollablePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);


  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
  

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/playlists`)
      .then((response) => {
        if (!response.ok) { console.log(`Request failed with status ${response.status}`); }
        return response.json();
      })
      .then((data: Playlist[]) => {
        setPlaylists(data);
      })
      .catch((error) => {
        console.error("Failed to fetch albums:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getCoverImage = (path?: string) => {
    if (!path || path == "" || path == null) { return DEFAULT_IMAGE; }
    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };


  return (
    <>
      <p className="text-center text-lg font-bold sticky text-white">Albums</p>
      <div className="relative flex items-center scrollbar-thumb-black scrollbar-auto scrollbar ease-in duration-75 shadow-lg">
        <li className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth p-1">
          <div id="slider"></div>
          {playlists.map((playlist) => (
            <div
              key={playlist.playlist_id}
              onClick={() => setSelectedPlaylist(playlist)}
              className="inline-block p-2 cursor-pointer transition-transform ease-linear hover:scale-105 flex flex-col items-center"
            >
              <div className="w-40 h-40 overflow-hidden rounded-lg">
                <img
                  className="w-full h-full object-cover cursor-pointer transition-transform ease-linear duration-[300ms]"
                  src={getCoverImage(playlist.cover_art_url)}
                  alt={playlist.name}
                />
              </div>
              <p className="text-white text-center mt-2 text-sm truncate max-w-[160px]">
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