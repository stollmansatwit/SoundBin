import React, { useEffect, useState } from "react";

import ArtistPopUp from "../popUpPage/ArtistPopUp";
import type { Artist } from "../../types";

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

export function ScrollableArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);


  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
  

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/artist-path`)
      .then((response) => {
        if (!response.ok) {
          console.log(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Artist[]) => {
        setArtists(data);
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

  const displayArtists = Array.isArray(artists) ? artists : [];

  return (
    <>
      <p className="text-center text-lg font-bold sticky text-white">Artists</p>
      <div className="relative flex items-center scrollbar-thumb-black scrollbar-auto scrollbar ease-in duration-75 shadow-lg">
        <ul className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth p-1 list-none">
          <li className="inline-block" /> {/* spacer */}
          {displayArtists.map((artist) => (
            <div
              key={artist.artist_id}
              onClick={() => setSelectedArtist(artist)}
              className="inline-flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-105"
            >
              <div className="relative">
                <img
                  className="w-24 h-24 lg:w-32 lg:h-32 xl:w-32 xl:h-32 object-cover shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  src={getCoverImage(artist.image_url)}
                  alt={artist.name}
                />
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
              </div>
                <p className="text-white text-base lg:text-sm font-semibold mb-3 truncate w-32 lg:w-36 xl:w-40 text-center leading-tight">
                    {artist.name}
                </p>
            </div>
          ))}
       <li className="inline-block" /> {/* spacer */}
        </ul>
      </div>
      {selectedArtist && (
        <ArtistPopUp
          artist={selectedArtist}
          onClose={() => setSelectedArtist(null)}
        />
        )}
    </>
  );
}
