import { useEffect, useMemo, useRef, useState } from "react";
import { type Track, type Album, type Artist } from "../../types";
import SongPopUp from "../popUpPage/SongPopUp";
import { API_BASE_URL } from '../../config';

import type { ReactNode, MouseEvent } from "react";

interface WipeRowProps {
  children: ReactNode;
  onClick?: () => void;
}

const WIPE_MS = 1000;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const NUDGE_PX = 18;

const COLS = "grid-cols-[38%_24%_26%_12%]";

const LERP_FACTOR = 0.1; // higher = snappier, lower = smoother/slower to catch up

import { forwardRef, useImperativeHandle } from "react";

export interface WipeRowHandle {
  enter: (edge: "top" | "bottom") => void;
  leave: (edge: "top" | "bottom") => void;
}

const WipeRow = forwardRef<WipeRowHandle, WipeRowProps>(function WipeRow(
  { children, onClick },
  ref
) {
  const rowRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const targetScale = useRef(0);
  const currentScale = useRef(0);
  const rafId = useRef<number | null>(null);

  const tick = () => {
    currentScale.current += (targetScale.current - currentScale.current) * LERP_FACTOR;
    if (Math.abs(targetScale.current - currentScale.current) < 0.001) {
      currentScale.current = targetScale.current;
      rafId.current = null;
    } else {
      rafId.current = requestAnimationFrame(tick);
    }
    if (overlayRef.current) {
      overlayRef.current.style.transform = `scaleY(${currentScale.current})`;
    }
  };

  const startLoop = () => {
    if (rafId.current == null) rafId.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const setNudge = (active: boolean) => {
    const cells = rowRef.current!.querySelectorAll<HTMLDivElement>("[data-cell]");
    const first = cells[0];
    const last = cells[cells.length - 1];
    if (first) first.style.transform = active ? `translateX(${NUDGE_PX}px)` : "translateX(0px)";
    if (last) last.style.transform = active ? `translateX(-${NUDGE_PX}px)` : "translateX(0px)";
  };

  const activate = (edge: "top" | "bottom", isEntering: boolean) => {
    if (overlayRef.current) overlayRef.current.style.transformOrigin = edge;
    targetScale.current = isEntering ? 1 : 0;
    startLoop();
    setNudge(isEntering);
  };

  useImperativeHandle(ref, () => ({
    enter: (edge) => activate(edge, true),
    leave: (edge) => activate(edge, false),
  }));

  const edgeFromEvent = (e: MouseEvent<HTMLDivElement>) => {
    const rect = rowRef.current!.getBoundingClientRect();
    return e.clientY - rect.top < rect.height / 2 ? "top" : "bottom";
  };

  return (
    <div
      ref={rowRef}
      role="row"
      onMouseEnter={(e) => activate(edgeFromEvent(e), true)}
      onMouseLeave={(e) => activate(edgeFromEvent(e), false)}
      onClick={onClick}
      className={`relative isolate grid ${COLS} cursor-pointer border-t border-black *:data-cell:relative *:data-cell:z-10 *:data-cell:transition-transform`}
      style={{ transitionDuration: `${WIPE_MS}ms`, transitionTimingFunction: EASE }}
    >
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-white pointer-events-none z-0"
        style={{ transform: "scaleY(0)", transformOrigin: "top" }}
      />
      {children}
    </div>
  );
});

export default WipeRow;


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



  const rowHandles = useRef<Map<number, WipeRowHandle>>(new Map());
  const rowEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const activeRowId = useRef<number | null>(null);
  const lastMouse = useRef<{ x: number; y: number } | null>(null);

  const evaluateHover = () => {
    if (!lastMouse.current) return;
    const el = document.elementFromPoint(lastMouse.current.x, lastMouse.current.y) as HTMLElement | null;
    const rowEl = el?.closest<HTMLElement>("[data-row-id]");
    const newId = rowEl ? Number(rowEl.dataset.rowId) : null;
    if (newId === activeRowId.current) return;

    if (activeRowId.current != null) {
      const prevEl = rowEls.current.get(activeRowId.current);
      const prevHandle = rowHandles.current.get(activeRowId.current);
      if (prevEl && prevHandle) {
        const rect = prevEl.getBoundingClientRect();
        const edge = lastMouse.current.y - rect.top < rect.height / 2 ? "top" : "bottom";
        prevHandle.leave(edge);
      }
    }
    if (newId != null) {
      const newEl = rowEls.current.get(newId);
      const newHandle = rowHandles.current.get(newId);
      if (newEl && newHandle) {
        const rect = newEl.getBoundingClientRect();
        const edge = lastMouse.current.y - rect.top < rect.height / 2 ? "top" : "bottom";
        newHandle.enter(edge);
      }
    }
    activeRowId.current = newId;
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  return (
    <>
      <div className="max-h-120 overflow-auto rounded-lg">
        <div
          className="max-h-120 overflow-auto rounded-lg"
          role="table"
          onMouseMove={handleContainerMouseMove}
          onScroll={evaluateHover}
        >
          <div
            role="row"
            className={`sticky top-0 grid ${COLS} bg-white text-xs font-bold uppercase tracking-wide text-gray-500 z-10`}
          >
            <div className="px-3 py-2">Title</div>
            <div className="px-3 py-2">Artist</div>
            <div className="px-3 py-2">Album</div>
            <div className="px-3 py-2 text-right">Duration</div>
          </div>

          <div role="rowgroup">
            {combinedItems.map((item) => (
              <div
                key={item.track.track_id}
                data-row-id={item.track.track_id}
                ref={(el) => {
                  if (el) rowEls.current.set(item.track.track_id, el);
                  else rowEls.current.delete(item.track.track_id);
                }}
              >
                <WipeRow
                  ref={(handle) => {
                    if (handle) rowHandles.current.set(item.track.track_id, handle);
                    else rowHandles.current.delete(item.track.track_id);
                  }}
                  onClick={() => setSelectedTrack(item.track)}
                >
                  <div data-cell className="px-3 py-2.5 font-bold text-gray-900 truncate">
                    {item.track.title}
                  </div>
                  <div data-cell className="px-3 py-2.5 font-normal text-gray-600 truncate">
                    {item.artist?.name ?? "Unknown"}
                  </div>
                  <div data-cell className="px-3 py-2.5 font-normal text-gray-600 truncate">
                    {item.album.title}
                  </div>
                  <div data-cell className="px-3 py-2.5 text-right font-normal text-gray-500">
                    {formatDuration(item.track.duration ? item.track.duration : 0)}
                  </div>
                </WipeRow>
              </div>
            ))}
          </div>
        </div>
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