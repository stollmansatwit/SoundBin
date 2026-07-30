import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Track } from "../../../types";
import { API_BASE_URL } from '../../../config';

const DEFAULT_IMAGE = "/defaultAlbum.png";

const getCoverImage = (path?: string) => {
  if (!path) return DEFAULT_IMAGE;
  const file = path.split("/").pop();
  return `${API_BASE_URL}/assets/${file}`;
};

interface Props {
  playlistId: number;
  /** Track ids already in the playlist, so they show a checkmark instead of a plus. */
  existingTrackIds: number[];
  /** Called after a track is successfully added, so the caller can refresh its list. */
  onAdded: (track: Track) => void;
  buttonClassName?: string;
}

const PANEL_WIDTH = 340;
const VIEWPORT_MARGIN = 12;
const MAX_PANEL_HEIGHT = 420;

/**
 * "+ Add Song" button that opens a tooltip-style popover (same anchored
 * portal approach as the queue popover) listing every song in the
 * library, with a search bar up top and a plus button per row to add it
 * to this playlist.
 */
export default function AddSongPopover({ playlistId, existingTrackIds, onAdded, buttonClassName = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<{ left: number; top: number; maxHeight: number; width: number } | null>(null);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAddedIds(new Set(existingTrackIds));
  }, [existingTrackIds]);

  useEffect(() => {
    if (!open || allTracks.length > 0) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/tracks`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Track[]) => setAllTracks(data))
      .catch((err) => console.error("[AddSongPopover] Failed to load tracks:", err))
      .finally(() => setLoading(false));
  }, [open, allTracks.length]);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      let left = rect.left;
      left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN));

      const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
      const spaceAbove = rect.top - VIEWPORT_MARGIN;
      const openBelow = spaceBelow >= Math.min(MAX_PANEL_HEIGHT, spaceAbove) || spaceBelow >= spaceAbove;

      const maxHeight = Math.max(160, Math.min(openBelow ? spaceBelow : spaceAbove, MAX_PANEL_HEIGHT));
      const top = openBelow ? rect.bottom + 8 : rect.top - maxHeight - 8;

      setStyle({ left, top, maxHeight, width });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allTracks;
    return allTracks.filter((track) => track.title.toLowerCase().includes(q));
  }, [allTracks, query]);

  const handleAdd = async (track: Track) => {
    if (pendingId !== null || addedIds.has(track.track_id)) return;
    setPendingId(track.track_id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/playlist-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_id: playlistId, track_id: track.track_id }),
      });
      if (!res.ok) throw new Error("Failed to add track to playlist");
      setAddedIds((prev) => new Set(prev).add(track.track_id));
      onAdded(track);
    } catch (error) {
      console.error("[AddSongPopover] Failed to add track:", error);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={buttonClassName || "flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="text-lg leading-none">+</span>
        <span>Add Song</span>
      </button>

      {open && style && createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Add a song"
          onClick={(e) => e.stopPropagation()}
          style={{ left: style.left, top: style.top, width: style.width, maxHeight: style.maxHeight }}
          className="fixed z-[100] rounded-lg border border-gray-700 bg-[#181818] shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="p-3 border-b border-gray-800 flex-shrink-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs..."
              autoFocus
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <p className="text-gray-500 text-sm italic px-4 py-3">Loading songs...</p>
            ) : filtered.length === 0 ? (
              <p className="text-gray-500 text-sm italic px-4 py-3">No songs found.</p>
            ) : (
              filtered.map((track) => {
                const isAdded = addedIds.has(track.track_id);
                return (
                  <div
                    key={track.track_id}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={getCoverImage(track.cover_art_url)}
                      alt=""
                      className="w-9 h-9 rounded object-cover flex-shrink-0"
                    />
                    <span className="text-sm text-white truncate flex-1">{track.title}</span>
                    <button
                      type="button"
                      onClick={() => handleAdd(track)}
                      disabled={isAdded || pendingId === track.track_id}
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isAdded
                          ? "bg-blue-500/20 text-blue-400 cursor-default"
                          : "bg-white/10 text-white hover:bg-white/20"
                      } disabled:opacity-60`}
                      aria-label={isAdded ? "Already in playlist" : `Add ${track.title}`}
                    >
                      {isAdded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-lg leading-none">+</span>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
