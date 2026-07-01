import { data } from '../test-imgs.ts';
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
      <li className='w-full overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth scrollbar-thumb-black shadow-lg text-white'>
        Playlists:
        <div id='slider'></div>
        
        {data.slice(0, 8).reverse().map((item: { img: string | undefined; id: number | undefined }) => (
          <div className='inline-block p-2 cursor-pointer'>
            <img className=' w-[120px] inline-block p-2 cursor-pointer transition-transform ease-linear' src={item.img} alt='album cover' />
            <label className='flex justify-center text-white text-sm'>Playlist {item.id}</label>
          </div>
        ))}
        
      </li>
    </div>
  );
}