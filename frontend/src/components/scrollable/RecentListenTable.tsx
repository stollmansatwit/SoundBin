import { useEffect, useState } from 'react';

type Album = {
  album_id: string;
  artist_id: string;
  title: string;
  cover_art_url?: string;
};

type Track = {
  track_id: string
  title: string
  album_id: string
};

type CombinedItem = {
  album: Album;
  trackTitle: string;
  track_id: string;
};
const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

export function RecentListenTable() {
  //TODO: show full song name on hover
  const MAX_SONG_NAME_LENGTH = 13;

  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [divMultiplier, setDivMultiplier] = useState(1);

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
        if (trackData.some(track => track.title.length > MAX_SONG_NAME_LENGTH)) {
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

  const combinedItems: CombinedItem[] = tracks.map((track, index) => ({
    album: albums[index] || { album_id: '', artist_id: '', title: '', cover_art_url: undefined },
    trackTitle: track.title, album_id: track.album_id,
    trackTitleFull: track.title, track_id: track.track_id,
  }));

  if (loading) {
    return <p className="text-center text-white">Loading...</p>;
  }



  return (
    // <>
    //   <p className='text-center text-lg font-bold sticky text-white'>Recently Listened To</p>
    //   <div className='scrollbar-thumb-black shadow-lg whitespace-nowrap overflow-y-hidden'>
    //     <li className='w-full overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-thumb-black shadow-lg'>
    //       {data.map((item: { id: number | undefined; img: string | undefined }) => (
    //         <div
    //           className='inline-block ml-2 mr-2 cursor-pointer w-40 h-10 border border-gray-400 rounded-lg shadow-lg hover:bg-gray-700 transition-colors duration-300'
    //           key={item.id}>
    //           <img className='inline-block justify-center w-10 m-auto rounded-[16px]' src={item.img} alt='album cover' />
    //           <label className='text-white text-sm m-5'>Song {item.id}</label>
    //         </div>
    //       ))}
    //     </li>
    //   </div>
    // </>

    <>
      <p className='text-center text-lg font-bold sticky text-white'>Recently Listened To</p>
      <div className='scrollbar-thumb-black shadow-lg whitespace-nowrap overflow-y-hidden'>
        <li className='w-full overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-thumb-black shadow-lg'>

          {combinedItems.map((item) => (
            <div

              className="inline-block w-48 hover:w-[var(--hover-width)] transition-all duration-300 border border-gray-400 rounded-lg hover:bg-gray-700"
              style={{
                "--hover-width": `${(item.trackTitle.length * 10 + 160)}px`,
              }}
              key={item.album.album_id}
              onMouseEnter={() => setHoveredTrackId(item.track_id)}
              onMouseLeave={() => setHoveredTrackId(null)}>
              <img className='inline-block justify-center w-10 m-auto rounded-[16px]' src={getCoverImage(item.album.cover_art_url)} alt={item.album.title} />
              <label className="text-white m-4">
                {item.trackTitle.length > MAX_SONG_NAME_LENGTH && hoveredTrackId !== item.track_id
                  ? `${item.trackTitle.slice(0, MAX_SONG_NAME_LENGTH)}...`
                  : item.trackTitle}
              </label>
            </div>
          ))}
        </li >
      </div >
    </>
  );
}
