import React from 'react';
import { data } from './test-imgs.js';

export function RecentListenTable() {
  return (
    <div className="relative flex items-center">
      <ul className = "relative text-center min-w-20 max-w-6xl">
        Recently Listened To:
        {data.map((item: { id: number | undefined; }) => (
          <li className='mt-14 w-[220px] inline-block p-2 cursor-pointer' alt='song name' key={item.id}>
            {item.id}
          </li>
        ))}
      </ul>
    </div>
  );
}