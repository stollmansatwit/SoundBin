import React from "react";
import { useAudio } from "../../context/AudioContext";
import { AlbumOptionsMenu } from "./AlbumOptionsMenu";
import type { Album, Track } from '../../types';

interface PlayAlbumProps {
  tracks: Track[];
  album: Album;
  artistName?: string;
  /** Called after the album is deleted from the options menu. */
  onDeleted?: () => void;
}

export function PlayAlbum({ tracks, album, artistName, onDeleted}: PlayAlbumProps) {
  const { shuffleMode, toggleShuffle, setQueue, togglePlay } = useAudio();

  const handlePlayAlbum = () => {
    if (!tracks || tracks.length === 0) return;

    // Optional: Update shuffle state immediately before playing to ensure it's reflected in queue handling if engine checks it during setQueue
    // Note: Our AudioEngine setQueue handles shuffling internally based on current state.shuffleMode.
    
    const tracksWithArtist = tracks.map((track) => ({
      ...track,
      artist: artistName || "Unkown Artist",
    }));

    setQueue(tracksWithArtist, 0);
    togglePlay();
  };

  const handleShuffleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling if parent has hover effects
    toggleShuffle();
  };

  return (
    <div className="flex items-center justify-center gap-4 w-full mt-6">
      {/* Main Play Button */}
      <button
        onClick={handlePlayAlbum}
        disabled={tracks.length === 0}
        className={`bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 transition-colors shadow-lg 
          ${tracks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Play Album"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      {/* Secondary Controls */}
      <div className="flex items-center gap-2">
        {/* Shuffle Toggle */}
        <button
          onClick={handleShuffleClick}
          className={`p-2 rounded-full transition-colors ${shuffleMode ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          aria-label="Toggle Shuffle"
          title={shuffleMode ? "Turn off shuffle" : "Turn on shuffle"}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
             {/* Shuffle Icon Path */}
             <path d="M19.76 3c-.34 0-.65.14-.88.38l-7.87 7.88a2.24 2.24 0 0 0 .13 3.16l5.55 5.55c1.56 1.56 4.09 1.56 5.65 0a4 4 0 0 0 0-5.65l-2.1-2.1a.75.75 0 0 0-1.06 1.06l2.1 2.1a2.5 2.5 0 1 1-3.54 3.54l-5.55-5.55a.75.75 0 0 1-.04-1.04l7.88-7.88a.75.75 0 0 1 1.06 1.06l-2.1 2.1c-.29.29-.77.29-1.06 0a.75.75 0 0 1 0-1.06l2.1-2.1A4 4 0 0 0 13.76 3H11v-2h2.76c1.1 0 2.16.44 2.94 1.22a4 4 0 0 1 2.95-1.22zM5.24 21c.34 0 .65-.14.88-.38l7.87-7.88a2.24 2.24 0 0 0-.13-3.16L8.21 4.03a4 4 0 0 0-5.65 0 4 4 0 0 0 0 5.65l2.1 2.1a.75.75 0 0 0 1.06-1.06l-2.1-2.1a2.5 2.5 0 1 1 3.54-3.54l5.55 5.55a.75.75 0 0 1 .04 1.04l-7.88 7.88a.75.75 0 0 1-1.06-1.06l2.1-2.1c.29-.29.77-.29 1.06 0a.75.75 0 0 1 0 1.06l-2.1 2.1A4 4 0 0 1 10.24 19H8v2h2.24z" />
          </svg>
        </button>

        {/* More Options (...) */}
        <AlbumOptionsMenu album={album} tracks={tracks} artistName={artistName} onDeleted={onDeleted} />
      </div>
    </div>
  );
}