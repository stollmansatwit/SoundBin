import { data } from "../test-imgs.ts";
import React, { useEffect, useState } from "react";

type Album = {
  album_id: string;
  title: string;
  cover_art_url?: string;
};

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

export function ScrollableAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("1");
    const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

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
    console.log("2");
    const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
    if (!path || path == "" || path == null) {
      return DEFAULT_IMAGE;
    }

    const file = path.split('/').pop();
    console.log(`file path: ${path}`);
    console.log(`file: ${file}`);
    return `${apiBaseUrl}/assets/${file}`;
  };

  console.log("3");
  const displayAlbum = Array.isArray(albums) ? albums : [];

  return (
    /**
     * <>
      <p className='text-center text-lg font-bold sticky text-white'>Albums</p>
      <div className='relative flex items-center scrollbar-thumb-black scrollbar-auto scrollbar ease-in duration-75 shadow-lg'>
        <li className='w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth p-1'>
          <div id='slider'></div>
          {data.map((item: { img: string | undefined; }) => (
            <img className=' w-40 inline-block p-2 cursor-pointer transition-transform ease-linear duration-[300ms] hover:duration-[2000ms] hover:rotate-[360deg] hover:scale-105 rounded-full' src={item.img} alt='album cover' />
          ))}
        </li>
      </div>
    </>
     */
    <>
      <p className="text-center text-lg font-bold sticky text-white">Albums</p>
      <div className="relative flex items-center scrollbar-thumb-black scrollbar-auto scrollbar ease-in duration-75 shadow-lg">
        <li className="w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth p-1">
          <div id="slider"></div>
          {displayAlbum.map((album) => (
            <img
              key={album.album_id}
              className=" w-40 inline-block p-2 cursor-pointer transition-transform ease-linear duration-[300ms] hover:duration-[2000ms] hover:rotate-[360deg] hover:scale-105 rounded-full"
              src={getCoverImage(album.cover_art_url)}
              alt={album.title}
            />
          ))}
        </li>
      </div>
    </>
  );
}
