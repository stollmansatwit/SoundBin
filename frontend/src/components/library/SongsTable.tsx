import { useEffect, useMemo, useState } from "react";
import { type Track, type Album, type Artist } from "../../types";
import SongPopUp from "../popUpPage/SongPopUp";
import { API_BASE_URL } from '../../config';



type CombinedItem = {
  track: Track;
  album: Album;
  artist: Artist;
};

export function SongsTable() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null> (null);
  const [loading, setLoading] = useState(true);
  // const [selectedItem, setSelectedItem] = useState<CombinedItem | null>(null);


  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  };

  // Fetch albums + tracks
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/album-path`)
      .then((response) => {
        if (!response.ok) {
          console.log(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Album[]) => {
        setAlbums(data);
      })
      .catch((error) => {
        console.error("Failed to fetch albums:", error);
      })
      .finally(() => {
        setLoading(false)
      });

    
    fetch(`${API_BASE_URL}/api/tracks`)
      .then((response) => {
        if (!response.ok) {
          console.log(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Track[]) => {
        setTracks(data);
      })
      .catch((error) => {
        console.error("Failed to fetch tracks:", error);
      })
      .finally(() => {
        setLoading(false)
      });

    fetch(`${API_BASE_URL}/api/artist-path`)
      .then((response) => {
        if (!response.ok) {
          console.log(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Artist[]) => {
        setArtists(data);
      })
      .catch((error) => {
        console.error("Failed to fetch artists:", error);
      })
      .finally(() => {
        setLoading(false)
      });
    }, []);


  // Resolve each track to its album + artist name
  const combinedItems: CombinedItem[] = useMemo(() => {
    return tracks
      .map((track) => {
        const album = albums.find((a) => a.album_id === track.album_id);
        if (!album) return null;
        const artist = artists.find((a) => a.artist_id === album.artist_id);

        return {
          track,
          album,
          artist
        };
      })
      .filter((item): item is CombinedItem => item !== null);
  }, [tracks, albums, artists]);

  if (loading) {
    return <p className="text-center text-white">Loading...</p>;
  }

  return (
    <>
      <div className="max-h-105 overflow-auto rounded-lg">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="sticky top-0 bg-white/95 text-xs font-bold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Artist</th>
              <th className="hidden px-3 py-2 sm:table-cell">Album</th>
              <th className="px-3 py-2 text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            {combinedItems.map((item) => (
              <tr
                key={item.track.track_id}
                className="border-t border-gray-200 hover:bg-white/80"
                onClick={() => setSelectedTrack(item.track)}
              >
                
                <td className="px-3 py-2.5 font-bold text-gray-900 max-w-[40vw] truncate sm:max-w-none">{item.track.title}</td>
                
                <td className="hidden px-3 py-2.5 font-normal text-gray-600 sm:table-cell">{item.artist.name}</td>
                <td className="px-3 py-2.5 font-normal text-gray-600 max-w-[28vw] truncate sm:max-w-none">{item.album.title}</td>
                <td className="px-3 py-2.5 text-right font-normal text-gray-500">{item.track.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedTrack && (
        <SongPopUp
          album_id={selectedTrack.album_id}
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
        />
      )}
    </>
  )
}