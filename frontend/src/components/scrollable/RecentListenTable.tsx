import { useEffect, useState } from 'react';
import SongPopUp from '../popUpPage/SongPopUp';
import { type RecentListen, type Track } from '../../types';

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found
const MAX_SONG_NAME_LENGTH = 13;

function timeAgo(isoDate: string): string {
  const playedAtMs = new Date(isoDate).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - playedAtMs) / 1000));

  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

export function RecentListenTable() {
  //TODO: show full song name on hover
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [listens, setListens] = useState<RecentListen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RecentListen | null>(null);

  useEffect(() => {
    const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

    fetch(`${apiBaseUrl}/api/activity/recent?limit=15`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Recent listens request failed with status ${response.status}`);
        }
        return response.json() as Promise<RecentListen[]>;
      })
      .then((data) => {
        setListens(data);
      })
      .catch((error) => {
        console.error("Failed to fetch recent listens:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getCoverImage = (path?: string | null) => {
    const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
    if (!path) {
      return DEFAULT_IMAGE;
    }

    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  if (loading) {
    return <p className="text-center text-white">Loading...</p>;
  }

  return (
    <>
      <p className='text-center text-lg font-bold sticky text-white'>Recently Listened To</p>

      {listens.length === 0 ? (
        <p className="text-center text-sm text-white/70 mt-2 px-4">
          Play a song to start building your listening history.
        </p>
      ) : (
        <div className='scrollbar-thumb-black shadow-lg whitespace-nowrap overflow-y-hidden'>
          <li className='w-full overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-thumb-black shadow-lg'>

            {listens.map((item) => (
              <div
                className="inline-block w-48 align-top hover:w-[var(--hover-width)] transition-all duration-300 border border-gray-400 rounded-lg hover:bg-gray-700 cursor-pointer"
                style={{
                  "--hover-width": `${(item.title.length * 10 + 160)}px`,
                } as React.CSSProperties}

                key={item.activity_id}
                onMouseEnter={() => setHoveredTrackId(String(item.track_id))}
                onMouseLeave={() => setHoveredTrackId(null)}
                onClick={() => setSelectedItem(item)}>
                <img className='inline-block justify-center w-10 m-auto rounded-[16px]' src={getCoverImage(item.cover_art_url)} alt={item.title} />
                <div className="text-white m-4 inline-block align-top">
                  <div>
                    {item.title.length > MAX_SONG_NAME_LENGTH && hoveredTrackId !== String(item.track_id)
                      ? `${item.title.slice(0, MAX_SONG_NAME_LENGTH)}...`
                      : item.title}
                  </div>
                  <div className="text-xs text-gray-300">{timeAgo(item.played_at)}</div>
                </div>
              </div>
            ))}
          </li >
        </div >
      )}

      {selectedItem && (
        <SongPopUp
          album_id={selectedItem.album_id ?? 0}
          track={{
            title: selectedItem.title,
            track_id: selectedItem.track_id,
            album_id: selectedItem.album_id ?? 0,
            duration: selectedItem.duration ?? 0,
          } as Track}
          onClose={() => setSelectedItem(null)}
        />
      )}

    </>
  );
}
