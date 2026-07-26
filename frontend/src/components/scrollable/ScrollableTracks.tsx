import { useEffect, useState } from 'react';
import SongPopUp from '../popUpPage/SongPopUp';
import type { Track } from '../../types';


const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

export function ScrollableTracks() {
  const MAX_SONG_NAME_LENGTH = 13;

  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<Track | null>(null);


  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

 useEffect(() => {
     fetch(`${apiBaseUrl}/api/tracks`)
       .then((response) => {
         if (!response.ok) { console.log(`Request failed with status ${response.status}`); }
         return response.json();
       })
       .then((data: Track[]) => {
         setTracks(data);
       })
       .catch((error) => {
         console.error("Failed to fetch albums:", error);
       })
       .finally(() => {
         setLoading(false);
       });
   }, []);


  const getCoverImage = (path?: string) => {
    if (!path || path == "" || path == null) { return DEFAULT_IMAGE; }
    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };


  if (loading) {
    return <p className="text-center text-white">Loading...</p>;
  }


  

  return (
    <>
      <p className='text-center text-lg font-bold sticky text-white'>Songs</p>
      <div className='relative w-full overflow-x-auto whitespace-nowrap pb-4 pl-4 scrollbar-thumb-black'>
        <div className="inline-flex gap-4 px-2">

          {tracks.map((song) => (
            <div
              className="group relative inline-block w-[180px] transition-all duration-300 
                         border border-transparent bg-gray-900/40 hover:bg-gray-800 
                         rounded-xl hover:border-white/20 shadow-md hover:shadow-lg 
                         cursor-pointer overflow-hidden"
              style={{
                "--hover-width": `${(song.title.length * 10 + 160)}px`,
              } as React.CSSProperties}
              
              key={song.track_id}
              onMouseEnter={() => setHoveredTrackId(String(song.track_id))}
              onMouseLeave={() => setHoveredTrackId(null)}
              onClick={() => setSelectedItem(song)}>
              <div className="p-3">
                <img 
                  className='w-full aspect-square object-cover rounded-lg mb-3 shadow-sm' 
                  src={getCoverImage(song.cover_art_url)} 
                  alt={song.title} 
                />
                
                <div className="flex flex-col items-center">
                   <span className={`text-white font-medium truncate w-full text-center ${hoveredTrackId === String(song.track_id) ? 'opacity-100' : 'opacity-90'} transition-opacity`}>
                    {song.title.length > MAX_SONG_NAME_LENGTH && hoveredTrackId !== String(song.track_id)
                      ? `${song.title.slice(0, MAX_SONG_NAME_LENGTH)}...`
                      : song.title}
                   </span>
                   <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div >

      {selectedItem && (
        <SongPopUp
          album_id={selectedItem.album_id}
          track={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

    </>
  );
}