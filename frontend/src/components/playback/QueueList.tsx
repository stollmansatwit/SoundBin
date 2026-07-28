import { useRef, useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { QueueItemOptionsMenu } from '../buttons/QueueItemOptionsMenu';
import { API_BASE_URL } from '../../config';

interface QueueListProps {
  className?: string;
}

const DEFAULT_IMAGE = "/defaultAlbum.png";

const getCoverImage = (path?: string) => {
  if (!path) return DEFAULT_IMAGE;
  const file = path.split('/').pop();
  return `${API_BASE_URL}/assets/${file}`;
};

const HamburgerIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
  </svg>
);

/**
 * Renders the "Now Playing" track followed by the upcoming queue.
 * Used both inside the mini-player's queue popover and, unmodified,
 * as the right-hand panel of the expanded playback view.
 *
 * Upcoming tracks can be reordered by dragging the hamburger handle.
 * A track can never be dragged above the "next song" slot — i.e. it
 * can only ever be brought as far forward as directly after whatever
 * is currently playing.
 */
export function QueueList({ className = '' }: QueueListProps) {
  const { currentQueue, queueIndex, removeFromQueue, moveQueueItem, playTrackAt } = useAudio();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const currentTrack = currentQueue[queueIndex];

  if (!currentTrack) {
    return (
      <div className={`flex items-center justify-center text-sm text-gray-500 p-6 ${className}`}>
        Queue is empty.
      </div>
    );
  }

  const minIndex = queueIndex + 1;
  const upcoming = currentQueue
    .map((track, index) => ({ track, index }))
    .slice(minIndex);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const rowEl = rowRefs.current[index];
    if (rowEl) {
      e.dataTransfer.setDragImage(rowEl, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex === null) return;
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (dragIndex !== null) {
      moveQueueItem(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      {/* Current Track — no buttons, sits at the top */}
      <div className="px-4 pt-3 pb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
        Now Playing
      </div>
      <div className="px-4 pb-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded overflow-hidden bg-gray-800 flex-shrink-0">
          {currentTrack.cover_art_url ? (
            <img
              src={getCoverImage(currentTrack.cover_art_url)}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">♫</div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-green-500 truncate">{currentTrack.title}</p>
          <p className="text-xs text-gray-400 truncate">{currentTrack.artist || 'Unknown Artist'}</p>
        </div>
      </div>

      {/* Upcoming Tracks */}
      {upcoming.length > 0 ? (
        <>
          <div className="px-4 pt-2 pb-2 text-xs font-bold text-gray-400 uppercase tracking-widest border-t border-white/10">
            Next Up
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {upcoming.map(({ track, index }) => (
              <div
                key={`${track.track_id}-${index}`}
                ref={(el) => { rowRefs.current[index] = el; }}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => playTrackAt(index)}
                className={`group flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors hover:bg-white/5 ${
                  dragOverIndex === index && dragIndex !== null && dragIndex !== index
                    ? 'bg-white/10'
                    : ''
                } ${dragIndex === index ? 'opacity-40' : ''}`}
              >
                <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                  {track.cover_art_url ? (
                    <img
                      src={getCoverImage(track.cover_art_url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">♫</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-gray-400 truncate">{track.artist || 'Unknown Artist'}</p>
                </div>

                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 flex-shrink-0">
                  <QueueItemOptionsMenu
                    track={track}
                    onRemove={() => removeFromQueue(index)}
                    buttonClassName="text-gray-400 hover:text-white p-1.5"
                  />
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    className="text-gray-500 hover:text-white p-1.5 cursor-grab active:cursor-grabbing touch-none"
                    title="Drag to reorder"
                    aria-label="Drag to reorder"
                  >
                    <HamburgerIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="px-4 py-6 text-xs text-gray-500 border-t border-white/10">
          No more tracks queued up.
        </div>
      )}
    </div>
  );
}
