import { data } from '../test-imgs.js';

const data2 = [...data, ...data]
export function RecentListenTable() {
  return (
    <>
    <p className='text-center text-lg font-bold sticky text-white'>Recently Listened To</p>
    <div className='scrollbar-thumb-black shadow-lg whitespace-nowrap overflow-y-hidden'>
      <li className = 'w-full overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-thumb-black shadow-lg'>
        {data2.map((item: { id: number | undefined; img: string | undefined }) => (
          <div className='inline-block ml-2 mr-2 cursor-pointer w-40 h-10 border border-gray-400 rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-300'>
              <img className='inline-block justify-center w-10 m-auto rounded-[16px]' src={item.img} alt='album cover' />
              <label className='text-white text-sm m-5'>Song {item.id}</label>
            </div>
        ))}
      </li>
    </div>
    </>
  );
}
