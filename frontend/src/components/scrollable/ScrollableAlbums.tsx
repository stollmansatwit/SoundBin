import { data } from '../test-imgs.ts';
import React, {useEffect, useState} from 'react';

  type Album = {
    id: String;
    title: string;
    cover_art_url?: string;
  }

  const DEFAULT_IMAGE = "https://docs.sonos.com/docs/add-album-art"; // change to an actual path in assets once better image found

export function ScrollableAlbums() {

  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
   const apiBaseUrl:string = 'http://localhost:3000'; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

   fetch(`${apiBaseUrl}/api/album-links`)
     .then((response) => {
         if (!response.ok) {
           throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Album[]) => {
        setAlbums(data);
      })
      .catch((error) => {
        console.error("Failed to fetch albums:", error)
      })
      .finally(() => {
        setLoading(false);
      });
   }, []);

   

  return (
    <>
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
  );
}