import { data } from '../test-imgs.ts';
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