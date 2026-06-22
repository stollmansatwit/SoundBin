import { useEffect, useState, useRef } from 'react';
import { data } from './test-imgs.js';

// type AlbumArt = {
//     url: string,
// };

export function ScrollableAlbums() {

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
        {data.map((item: { img: string | undefined; }) => (
          <img className='mt-14 w-[220px] inline-block p-2 cursor-pointer hover:scale-105 ease-in-out duration-300 rounded-[30%]' src={item.img} alt='album cover' />
        ))}
      </li>
    </div>
  );
}