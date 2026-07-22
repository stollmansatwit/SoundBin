import React from "react";
import { useAudio } from "../../context/AudioContext";

interface PlayAlbumProps {
  albumId: string;
  tracksLength: number;
}

export function PlayAlbum({ albumId, tracksLength }: PlayAlbumProps) {
  const { togglePlay, shuffle, repeat, toggleShuffle, toggleRepeat } = useAudio();

  // For now, we assume the first track of the album is passed via context or we trigger a generic "Play Album" action.
  // Since we don't have a clear "playAlbum(id)" in current Context, we might need to update Context later.
  // Let's create a placeholder function that would ideally be in Context.
  const handlePlayAlbum = () => {
    console.log(`Playing Album: ${albumId}`);
    // TODO: Implement actual album playback logic in AudioContext/useAudioEngine
  };

  return (
    <div className="flex items-center justify-center gap-4 w-full mt-6">
      {/* Main Play Button */}
      <button
        onClick={handlePlayAlbum}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 transition-colors shadow-lg"
        aria-label="Play Album"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      {/* Secondary Controls */}
      <div className="flex items-center gap-2">
        {/* Shuffle */}
        <button
          onClick={toggleShuffle}
          className={`p-2 rounded-full transition-colors ${shuffle ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          aria-label="Toggle Shuffle"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
             {/* Shuffle Icon Path */}
             <path d="M19.76 3c-.34 0-.65.14-.88.38l-7.87 7.88a2.24 2.24 0 0 0 .13 3.16l5.55 5.55c1.56 1.56 4.09 1.56 5.65 0a4 4 0 0 0 0-5.65l-2.1-2.1a.75.75 0 0 0-1.06 1.06l2.1 2.1a2.5 2.5 0 1 1-3.54 3.54l-5.55-5.55a.75.75 0 0 1-.04-1.04l7.88-7.88a.75.75 0 0 1 1.06 1.06l-2.1 2.1c-.29.29-.77.29-1.06 0a.75.75 0 0 1 0-1.06l2.1-2.1A4 4 0 0 0 13.76 3H11v-2h2.76c1.1 0 2.16.44 2.94 1.22a4 4 0 0 1 2.95-1.22zM5.24 21c.34 0 .65-.14.88-.38l7.87-7.88a2.24 2.24 0 0 0-.13-3.16L8.21 4.03a4 4 0 0 0-5.65 0 4 4 0 0 0 0 5.65l2.1 2.1a.75.75 0 0 0 1.06-1.06l-2.1-2.1a2.5 2.5 0 1 1 3.54-3.54l5.55 5.55a.75.75 0 0 1 .04 1.04l-7.88 7.88a.75.75 0 0 1-1.06-1.06l2.1-2.1c.29-.29.77-.29 1.06 0a.75.75 0 0 1 0 1.06l-2.1 2.1A4 4 0 0 1 10.24 19H8v2h2.24z" />
          </svg>
        </button>

        {/* Repeat */}
        <button
          onClick={toggleRepeat}
          className={`p-2 rounded-full transition-colors ${repeat !== 'off' ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
          aria-label="Toggle Repeat"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
             {/* Repeat Icon Path */}
             <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
        </button>

        {/* More Options (...) */}
        <div className="relative group">
          <button
            className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
            aria-label="More options"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
          {/* Dropdown Menu (Hidden by default, shown on hover/click) */}
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-20">
            {/* Add menu items here */}
            <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Download</button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}