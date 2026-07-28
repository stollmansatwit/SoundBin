import { useEffect, useState } from 'react';
import SongPopUp from '../../popUpPage/SongPopUp';
import type { Track } from '../../../types';


const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

type TrackListProps = {
  tracks: Track[];
};

export function ScrollableArtistTracks({ tracks }: TrackListProps) {
  const MAX_SONG_NAME_LENGTH = 13;

  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<Track | null>(null);


  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;


  const getCoverImage = (path?: string) => {
    if (!path || path == "" || path == null) { return DEFAULT_IMAGE; }
    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  return (
     <>
      {/* Container handles the scrolling and spacing between items via gap */}
      <div className="relative w-full overflow-x-auto whitespace-nowrap pb-6 pl-6 scrollbar-thumb-black shadow-lg">
        <div className="inline-flex gap-6 lg:gap-8 px-2">

          {tracks.map((song) => (
            <div
              className="group relative inline-flex w-[200px] lg:w-[240px] xl:w-[260px] flex-col 
                         bg-gray-800/40 hover:bg-gray-700/60 
                         border border-gray-700/30 hover:border-white/10 
                         rounded-lg transition-all duration-200 
                         shadow-sm hover:shadow-md 
                         cursor-pointer overflow-hidden"
              
              style={{
                minWidth: "200px",
                maxWidth: `${(song.title.length * 10 + 200)}px`,
              }}
              
              key={song.track_id}
              onMouseEnter={() => setHoveredTrackId(String(song.track_id))}
              onMouseLeave={() => setHoveredTrackId(null)}
              onClick={() => setSelectedItem(song)}>
              
              <div className="p-3 flex items-center gap-3">
                {/* Smaller, rounded image */}
                <img 
                  className='w-12 h-12 lg:w-14 lg:h-14 object-cover rounded-md shadow-sm bg-gray-900' 
                  src={getCoverImage(song.cover_art_url)} 
                  alt={song.title} 
                />
                
                <div className="flex flex-col justify-center min-w-0">
                   {/* Text truncation handled naturally by CSS */}
                   <span className={`text-sm lg:text-base font-medium text-gray-100 truncate w-full ${hoveredTrackId === String(song.track_id) ? 'text-white' : 'text-gray-300'} transition-colors`}>
                    {song.title.length > MAX_SONG_NAME_LENGTH && hoveredTrackId !== String(song.track_id)
                      ? `${song.title.slice(0, MAX_SONG_NAME_LENGTH)}...`
                      : song.title}
                   </span>
                </div>
              </div>
              
              {/* Subtle hover indicator line at the bottom */}
              <div className="h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
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