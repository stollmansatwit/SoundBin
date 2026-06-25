import { useEffect, useState, useRef } from 'react';
import { data } from '../test-imgs.ts';
import React from 'react';
// type AlbumArt = {
//     url: string,
// };

export function ScrollablePlaylists() {

  // useEffect(() => {
  // const apiBaseUrl:string = 'http://localhost:3000';

  // fetch(`${apiBaseUrl}/api/album-links`)
  //   .then((response) => {
  //     if (!response.ok) {
  //       throw new Error(`Request failed with status ${response.status}`);
  //     }

  //     return response.json() as Promise<AlbumArt[]>;
  //     })
  //  });




  return (
    <div className="relative flex items-center">
      <li className='w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth'>
        <div id='slider'></div>
        Playlists:
        {data.map((item: { id: number | undefined; }) => (
          <div className='mt-14 w-[220px] inline-block p-2 cursor-pointer hover:scale-105 ease-in-out duration-300 rounded-[75px]' key={item.id}>
            {item.id}
          </div>
        ))}
      </li>
    </div>
  );
}