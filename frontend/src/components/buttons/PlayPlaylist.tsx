import type React from "react";
import { useAudio } from "../../context/AudioContext";
import { PlaylistOptionsMenu } from "./PlaylistOptionsMenu";
import type { Playlist, Track } from "../../types";

interface PlayPlaylistProps {
  playlist: Playlist;
  tracks: Track[];
  onPlaylistUpdated?: (playlist: Playlist) => void;
  /** Called after the playlist is deleted from the options menu. */
  onDeleted?: () => void;
}

export function PlayPlaylist({ playlist, tracks, onPlaylistUpdated, onDeleted }: PlayPlaylistProps) {
  const { shuffleMode, toggleShuffle, setQueue, togglePlay } = useAudio();

  const handlePlayPlaylist = () => {
    if (!tracks || tracks.length === 0) return;
    setQueue(tracks, 0);
    togglePlay();
  };

  const handleShuffleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleShuffle();
  };

  return (
    <div className="flex items-center justify-center gap-4 w-full mt-6">
      {/* Main Play Button */}
      <button
        onClick={handlePlayPlaylist}
        disabled={tracks.length === 0}
        className={`bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 transition-colors shadow-lg 
          ${tracks.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Play Playlist"
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
          className="group p-2 rounded-full transition-colors"
          aria-label="Toggle Shuffle"
          aria-pressed={shuffleMode}
          title={shuffleMode ? "Turn off shuffle" : "Turn on shuffle"}
        >
          <svg
            className={`w-5 h-5 ${shuffleMode ? 'text-blue-500' : 'text-gray-400 group-hover:text-white'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 3h5v5" />
            <path d="M4 20L21 3" />
            <path d="M21 16v5h-5" />
            <path d="M15 15l6 6" />
            <path d="M4 4l5 5" />
          </svg>
        </button>

        {/* More Options (...) */}
        <PlaylistOptionsMenu playlist={playlist} tracks={tracks} onPlaylistUpdated={onPlaylistUpdated} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
