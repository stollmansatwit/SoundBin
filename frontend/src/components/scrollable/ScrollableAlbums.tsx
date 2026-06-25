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
    <div className='relative flex items-center scrollbar-thumb-orange-500 scrollbar-track-orange-200 scrollbar-thin scrollbar ease-in duration-75'>
      <li className='w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth p-1 text-center '>
        Albums
        <div id='slider'></div>
        {data.map((item: { img: string | undefined; }) => (
          <img className=' w-[220px] inline-block p-2 cursor-pointer hover:animate-ping-once ease-in-out duration-300 rounded-full' src={item.img} alt='album cover' />
        ))}
      </li>
    </div>
  );
}