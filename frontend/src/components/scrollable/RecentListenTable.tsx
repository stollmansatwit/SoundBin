import { data } from '../test-imgs.js';

export function RecentListenTable() {
  return (
    <div className='relative flex items-center scrollbar-thumb-black'>
      <ul className = 'w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth'>
        Recently Listened To:
        {data.map((item: { id: number | undefined; }) => (
          <li className='mt-14 w-[220px] inline-block p-2 cursor-pointer' key={item.id}>
            {item.id}
          </li>
        ))}
      </ul>
    </div>
  );
}
