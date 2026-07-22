import React, { useEffect, useState } from "react";

import AlbumPopUp from "../popUpPage/AlbumPopUp";
import type { Album } from "../../types";

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

export function ScrollableAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);


  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
  

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/album-path`)
      .then((response) => {
        if (!response.ok) {
          console.log(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Album[]) => {
        setAlbums(data);
      })
      .catch((error) => {
        console.error("Failed to fetch albums:", error);
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

  const displayAlbum = Array.isArray(albums) ? albums : [];

  return (
    <>
      <p className="text-center text-lg font-bold sticky text-white">Albums</p>
      <div className="relative flex items-center scrollbar-thumb-black scrollbar-auto scrollbar ease-in duration-75 shadow-lg">
        <li className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth p-1">
          <div id="slider"></div>
          {displayAlbum.map((album) => (
            <img
              key={album.album_id}
              onClick={() => setSelectedAlbum(album)}
              className=" w-40 inline-block p-2 cursor-pointer transition-transform ease-linear duration-[300ms] hover:duration-[2000ms] hover:rotate-[360deg] hover:scale-105 rounded-full"
              src={getCoverImage(album.cover_art_url)}
              alt={album.title}
            />
          ))}
        </li>
      </div>
        {selectedAlbum && (
          <AlbumPopUp
            album={selectedAlbum}
            onClose={() => setSelectedAlbum(null)}
          />
        )}
    </>
  );
}
