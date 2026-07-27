import React, { useEffect, useState } from "react";

import AlbumPopUp from "../../popUpPage/AlbumPopUp";
import type { Album } from "../../../types";

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found\

type AlbumListProps = {
  albums: Album[];
};

export function ScrollableArtistAlbums({ albums }: AlbumListProps) {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);


  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  const getCoverImage = (path?: string) => {
    if (!path || path == "" || path == null) {
      return DEFAULT_IMAGE;
    }

    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  const displayAlbum = Array.isArray(albums) ? albums : [];

  if (displayAlbum.length === 0) {
    return (
      <div className="bg-gray-800/50 p-4 rounded-lg text-gray-500 italic">
        No albums for this artist yet.
      </div>
    );
  }

  return (
    <>
      <div className="relative flex items-center scrollbar-thumb-black scrollbar-auto scrollbar ease-in duration-75 shadow-lg">
        <li className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth p-1">
          <div id="slider"></div>
          {displayAlbum.map((album) => (
            <div key={album.album_id} className="inline-block">
              <img
                onClick={() => setSelectedAlbum(album)}
                className=" w-40 inline-block p-2 cursor-pointer transition-transform ease-linear duration-[300ms] hover:duration-[2000ms] hover:rotate-[360deg] hover:scale-105 rounded-full"
                src={getCoverImage(album.cover_art_url)}
                alt={album.title}
              />
              <p className="text-white text-base font-semibold mb-3 truncate w-40 text-center leading-tight">
                  {album.title}
              </p>
          </div>
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