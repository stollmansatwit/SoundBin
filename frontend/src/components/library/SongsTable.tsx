import { useEffect, useMemo, useRef, useState } from "react";
import { type Track, type Album, type Artist } from "../../types";
import SongPopUp from "../popUpPage/SongPopUp";
import { API_BASE_URL } from '../../config';


function WipeRow({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const handleAnimationEnd = () => {
      el.classList.remove("playing");
    };
    el.addEventListener("animationend", handleAnimationEnd);
    return () => el.removeEventListener("animationend", handleAnimationEnd);
  }, []);

  return (
    <tr
      ref={rowRef}
      className="wipe border-t border-black hover:bg-white"
      onClick={onClick}
    >
      {children}
    </tr>
  );
}


type CombinedItem = {
  track: Track;
  album: Album;
  artist: Artist | undefined;
};

export function SongsTable() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

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



  const triggerRow = (row: HTMLElement) => {
    if (row.classList.contains("playing")) return;
    row.classList.add("playing");
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const curr = { x: e.clientX, y: e.clientY };
    if (lastPos.current) {
      const dist = Math.hypot(curr.x - lastPos.current.x, curr.y - lastPos.current.y);
      const steps = Math.min(Math.max(1, Math.ceil(dist / 8)), 15);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = lastPos.current.x + (curr.x - lastPos.current.x) * t;
        const y = lastPos.current.y + (curr.y - lastPos.current.y) * t;
        const el = document.elementFromPoint(x, y) as HTMLElement | null;
        const row = el?.closest("tr.wipe") as HTMLElement | null;
        if (row) triggerRow(row);
      }
    }
    lastPos.current = curr;
  };
  return (
    <>
      <div className="max-h-120 overflow-auto rounded-lg">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="sticky top-0 bg-white/95 text-xs font-bold uppercase tracking-wide text-gray-500 z-10">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Artist</th>
              <th className="px-3 py-2 sm:table-cell">Album</th>
              <th className="px-3 py-2 text-right">Duration</th>
            </tr>
          </thead>
          <tbody
            onMouseMove={handleMouseMove}
            onMouseLeave={() => (lastPos.current = null)}
          >
            {combinedItems.map((item) => (
              <WipeRow key={item.track.track_id} onClick={() => setSelectedTrack(item.track)}>
                <td className="px-3 py-2.5 font-bold text-gray-900 max-w-[40vw] truncate sm:max-w-none">
                  {item.track.title}
                </td>
                <td className="px-3 py-2.5 font-normal text-gray-600 sm:table-cell">
                  {item.artist?.name ?? "Unknown"}
                </td>
                <td className="px-3 py-2.5 font-normal text-gray-600 max-w-[28vw] truncate sm:max-w-none">
                  {item.album.title}
                </td>
                <td className="px-3 py-2.5 text-right font-normal text-gray-500">
                  {formatDuration(item.track.duration ? item.track.duration : 0)}
                </td>
              </WipeRow>
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