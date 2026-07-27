import { useEffect, useState } from 'react';
import SongPopUp from '../../popUpPage/SongPopUp';
import type { RecentListen, Track } from '../../../types';

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found
const MAX_SONG_NAME_LENGTH = 13;

type ArtistListenedToProps = {
  artistId: number;
};

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

export function ScrollableArtistListenedTo({ artistId }: ArtistListenedToProps) {
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [listens, setListens] = useState<RecentListen[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<RecentListen | null>(null);

  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  useEffect(() => {
    if (!artistId) return;

    setLoading(true);
    fetch(`${apiBaseUrl}/api/artist-recent-listens?artistID=${artistId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json() as Promise<RecentListen[]>;
      })
      .then((data) => {
        setListens(data);
      })
      .catch((error) => {
        console.error("Failed to fetch artist recent listens:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [artistId]);

  const getCoverImage = (path?: string | null) => {
    if (!path) { return DEFAULT_IMAGE; }
    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  if (loading) {
    return <p className="text-gray-500 italic">Loading listening history...</p>;
  }

  if (listens.length === 0) {
    return (
      <div className="bg-gray-800/50 p-4 rounded-lg text-gray-500 italic">
        No listens for this artist yet.
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full overflow-x-auto whitespace-nowrap pb-6 pl-6 scrollbar-thumb-black shadow-lg">
        <div className="inline-flex gap-6 px-2">

          {listens.map((item) => (
            <div
              className="group relative inline-flex w-[200px] flex-col
                         bg-gray-800/40 hover:bg-gray-700/60
                         border border-gray-700/30 hover:border-white/10
                         rounded-lg transition-all duration-200
                         shadow-sm hover:shadow-md
                         cursor-pointer overflow-hidden"

              style={{
                minWidth: "200px",
                maxWidth: `${(item.title.length * 10 + 200)}px`,
              }}

              key={item.activity_id}
              onMouseEnter={() => setHoveredTrackId(String(item.track_id))}
              onMouseLeave={() => setHoveredTrackId(null)}
              onClick={() => setSelectedItem(item)}>

              <div className="p-3 flex items-center gap-3">
                <img
                  className='w-12 h-12 object-cover rounded-md shadow-sm bg-gray-900'
                  src={getCoverImage(item.cover_art_url)}
                  alt={item.title}
                />

                <div className="flex flex-col justify-center min-w-0">
                  <span className={`text-sm font-medium truncate w-full ${hoveredTrackId === String(item.track_id) ? 'text-white' : 'text-gray-300'} transition-colors`}>
                    {item.title.length > MAX_SONG_NAME_LENGTH && hoveredTrackId !== String(item.track_id)
                      ? `${item.title.slice(0, MAX_SONG_NAME_LENGTH)}...`
                      : item.title}
                  </span>
                  <span className="text-xs text-gray-500">{timeAgo(item.played_at)}</span>
                </div>
              </div>

              <div className="h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
            </div>
          ))}
        </div>
      </div>

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
