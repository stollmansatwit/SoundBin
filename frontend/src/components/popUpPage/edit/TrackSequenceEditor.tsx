import { useRef, useState } from "react";
import type { Track } from "../../../types";
import { API_BASE_URL } from "../../../config";

const DEFAULT_IMAGE = "/defaultAlbum.png";

const getCoverImage = (path?: string) => {
  if (!path) return DEFAULT_IMAGE;
  const file = path.split("/").pop();
  return `${API_BASE_URL}/assets/${file}`;
};

const HamburgerIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
  </svg>
);

interface Props {
  tracks: Track[];
  onChange: (nextTracks: Track[]) => void;
  /** Extra classes on the scroll container — use to control height (e.g. "flex-1 max-h-none" to fill a column) instead of the default fixed height. */
  className?: string;
}

/**
 * Reorderable track list for the Album/Playlist edit modals — drag the
 * hamburger handle to move a track above or below others, same
 * interaction as the playback queue.
 */
export default function TrackSequenceEditor({ tracks, onChange, className = "" }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    const rowEl = rowRefs.current[index];
    if (rowEl) {
      e.dataTransfer.setDragImage(rowEl, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null) return;
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      const next = [...tracks];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      onChange(next);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  if (tracks.length === 0) {
    return <p className="text-gray-500 text-sm italic px-1 py-2">No tracks to reorder.</p>;
  }

  return (
    <div className={`overflow-y-auto custom-scrollbar rounded-md border border-gray-800 bg-gray-800/40 ${className || "max-h-56"}`}>
      {tracks.map((track, index) => (
        <div
          key={track.track_id}
          ref={(el) => { rowRefs.current[index] = el; }}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          className={`flex items-center gap-3 px-3 py-2 border-b border-gray-800/60 last:border-none transition-colors ${
            dragOverIndex === index && dragIndex !== null && dragIndex !== index ? "bg-white/10" : ""
          } ${dragIndex === index ? "opacity-40" : ""}`}
        >
          <span className="text-gray-500 text-xs w-5 flex-shrink-0 text-right">{index + 1}</span>
          <div className="w-9 h-9 rounded overflow-hidden bg-gray-800 flex-shrink-0">
            <img src={getCoverImage(track.cover_art_url)} alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm text-white truncate flex-1">{track.title}</span>
          <button
            type="button"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            className="text-gray-500 hover:text-white p-1.5 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            title="Drag to reorder"
            aria-label="Drag to reorder"
          >
            <HamburgerIcon />
          </button>
        </div>
      ))}
    </div>
  );
}
