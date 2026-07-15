import React from "react";
import { useAudio } from "../../context/AudioContext";

interface PlayButtonProps {
  trackId: number;
  className?: string; // Optional for extra styling control
}

/**
 * Uses Audio Context to play audio selected
 * 
 * Selcets correct audio by using trackId, which is passed to useAudio
 */
export function PlayButton({ trackId, className = "" }: PlayButtonProps) {
  const { togglePlay, currentTrackId, isPlaying } = useAudio();
  
  const handleClick = () => {
    console.log(`[PlayButton] Triggering play for track: ${trackId}`);
    togglePlay(trackId);
  };

  const isActive = isPlaying && currentTrackId === trackId;

  return (
    <button
      onClick={handleClick}
      className={`
        bg-white/10 p-2 rounded-full hover:bg-white/20 
        active:bg-white/30 transition-all duration-200
        border ${isActive ? 'border-blue-500' : 'border-white/10'} 
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      aria-label={isPlaying && currentTrackId === trackId ? "Pause" : `Play track ${trackId}`}
    >
      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
        {isActive ? (
          // Pause icon when playing this track
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        ) : (
          // Play icon when not playing
          <path d="M8 5v14l11-7z" />
        )}
      </svg>
    </button>
  );
}
