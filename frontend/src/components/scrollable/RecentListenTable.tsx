import { useEffect, useState } from 'react';
import SongPopUp from '../popUpPage/SongPopUp';
import { type Album, type Track } from '../../types';


type CombinedItem = {
  album: Album;
  trackTitle: string;
  track_id: number;
};
const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

export function RecentListenTable() {
  //TODO: show full song name on hover
  const MAX_SONG_NAME_LENGTH = 13;

  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CombinedItem | null>(null);


  useEffect(() => {
    const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

    const fetchAlbums = fetch(`${apiBaseUrl}/api/album-path`).then((response) => {
      if (!response.ok) {
        throw new Error(`Album request failed with status ${response.status}`);
      }
      return response.json() as Promise<Album[]>;
    });

    const fetchTracks = fetch(`${apiBaseUrl}/api/tracks`).then((response) => {
      if (!response.ok) {
        throw new Error(`Track request failed with status ${response.status}`);
      }
      return response.json() as Promise<Track[]>;
    });

    Promise.all([fetchAlbums, fetchTracks])
      .then(([albumData, trackData]) => {
        if (trackData.some(track => track.title && track.title.length > MAX_SONG_NAME_LENGTH)) {
          // If any track title exceeds the max length, truncate the titles
          trackData = trackData.map(track => ({
            ...track,
            title: track.title

          }));
        }
        // get track title (called trackTitleFull) and truncate it in new variable called title

        setAlbums(albumData);
        setTracks(trackData);
      })
      .catch((error) => {
        console.error("Failed to fetch recent listens:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const getCoverImage = (path?: string) => {
    const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
    if (!path || path == "" || path == null) {
      return DEFAULT_IMAGE;
    }

    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  const lookupAlbumById = (albumId: number): Album | undefined => {
    return albums.find(album => Number(album.album_id) === albumId);
  };
  const combinedItems: CombinedItem[] = tracks.map((track) => ({
    album: lookupAlbumById(track.album_id) || { album_id: 0, artist_id: null, title: '', cover_art_url: undefined },
    trackTitle: track.title ? track.title: "",
    track_id: track.track_id ? track.track_id: 0,
  }));

  if (loading) {
    return <p className="text-center text-white">Loading...</p>;
  }



  return (
    <>
      <p className='text-center text-lg font-bold sticky text-white'>Recently Listened To</p>
      <div className='scrollbar-thumb-black shadow-lg whitespace-nowrap overflow-y-hidden'>
        <li className='w-full overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-thumb-black shadow-lg'>

          {combinedItems.map((item) => (
            <div
              className="inline-block w-48 hover:w-[var(--hover-width)] transition-all duration-300 border border-gray-400 rounded-lg hover:bg-gray-700 cursor-pointer"
              style={{
                "--hover-width": `${(item.trackTitle.length * 10 + 160)}px`,
              } as React.CSSProperties}
              
              key={item.track_id}
              onMouseEnter={() => setHoveredTrackId(String(item.track_id))}
              onMouseLeave={() => setHoveredTrackId(null)}
              onClick={() => setSelectedItem(item)}>
              <img className='inline-block justify-center w-10 m-auto rounded-[16px]' src={getCoverImage(item.album.cover_art_url)} alt={item.album.title} />
              <label className="text-white m-4">
                {item.trackTitle.length > MAX_SONG_NAME_LENGTH && hoveredTrackId !== String(item.track_id)
                  ? `${item.trackTitle.slice(0, MAX_SONG_NAME_LENGTH)}...`
                  : item.trackTitle}
                  
              </label>
            </div>
          ))}
        </li >
      </div >

      {selectedItem && (
        <SongPopUp
          album={selectedItem.album}
          track={{ title: selectedItem.trackTitle, track_id: selectedItem.track_id, album_id: selectedItem.album.album_id, duration: tracks.find(track => track.track_id === selectedItem.track_id)?.duration || 0 }}
          onClose={() => setSelectedItem(null)}
        />
      )}

    </>
  );
}