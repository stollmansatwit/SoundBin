import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { PlaybarOptionsMenu } from '../buttons/PlaybarOptionsMenu';

interface PlaybackControlBarProps {
  className?: string;
}

export function PlaybackControlBar({ className = "" }: PlaybackControlBarProps) {
  const { 
    currentTrackId,
    currentTrackMetadata,
    isPlaying,
    currentTime,
    duration,
    shuffleMode,
    repeatMode,
    //pause,
    togglePlay,
    toggleShuffle,
    toggleRepeat,
    playNext,
    playPrevious,
    //currentQueue - used for viewing queue
    seek,
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTrackId) return null; // Don't render anything if no track is playing

  const title = currentTrackMetadata?.title || `Track #${currentTrackId}`;
  const artist = currentTrackMetadata?.artist || "Unknown Artist";
  const coverArt = currentTrackMetadata?.cover_art_url || "";

  /**
   * Helpers
   */
  // Calculate progress percentage for the bar
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (sec: number) => {
    if(!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const Icons = {
    Play: () => <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>,
    Pause: () => <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>,
    Prev: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>,
    Next: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>,
    ChevronDown: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
    ChevronUp: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
    ShuffleOn: () => <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M7.77 6.76L6.22 5.2.68 10.74l15.54 15.54 5.54-5.54-1.56-1.56-4.98 4.98L5.4 12l10.38-10.38 1.56 1.56L7.77 6.76zM20.32 6.24l-5.54 5.54-4.98-4.98 1.56-1.56L20.32 12.8l-1.02 1.02 1.56 1.56 4.98-4.98-1.56-1.56-3.98 3.98z"/></svg>,
    ShuffleOff: () => <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7.77 6.76L6.22 5.2.68 10.74l15.54 15.54 5.54-5.54-1.56-1.56-4.98 4.98L5.4 12l10.38-10.38 1.56 1.56L7.77 6.76z"/></svg>,
    RepeatAll: () => <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
    RepeatOne: () => <div className="relative w-5 h-5 text-green-500"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg><span className="absolute top-0 right-0 text-[8px] font-bold leading-none">1</span></div>,
    RepeatOff: () => <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
    Queue: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>,
    Dots: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>,
  };

  const getRepeatIcon = () => {
    if (repeatMode === 'one') return <Icons.RepeatOne />;
    if (repeatMode === 'all') return <Icons.RepeatAll />;
    return <Icons.RepeatOff />;
  };

  // Determine Shuffle Icon
  const getShuffleIcon = () => {
    if (shuffleMode) return <Icons.ShuffleOn />;
    return <Icons.ShuffleOff />;
  };

  /**
   * 
   * @param path 
   * @returns 
   */
  const getCoverImage = (path?: string) => {
    const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
    const DEFAULT_IMAGE = "/defaultAlbum.png";
    if (!path || path == "" || path == null) {
      return DEFAULT_IMAGE;
    }

    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  /**
   * 
   */
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || duration <= 0) return;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const fraction = Math.max(0, Math.min(clickX / width, 1));
    seek(fraction * duration);
  }



  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      
      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-[#121212] text-white pt-4 pb-6 px-4 md:px-16 border-t border-white/10 shadow-2xl transition-all duration-300">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Now Playing</h3>
             <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Icons.ChevronDown />
             </button>
          </div>

          {/* Content Grid */}
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start max-w-5xl mx-auto">
            
            {/* Album Art */}
            <div className="w-full md:w-1/3 aspect-square bg-gray-800 rounded-lg shadow-xl overflow-hidden flex-shrink-0 group relative">
               {coverArt ? (
                 <img src={getCoverImage(coverArt)} alt="Album Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-600">
                   <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                 </div>
               )}
            </div>

            {/* Info & Controls */}
            <div className="w-full md:w-2/3 flex flex-col gap-6">
              
              {/* Text Info */}
              <div className="text-center md:text-left space-y-2">
                <h1 className="text-2xl md:text-4xl font-bold truncate leading-tight">{title}</h1>
                <p className="text-lg text-gray-400 truncate hover:underline cursor-pointer decoration-gray-500 underline-offset-4">{artist}</p>
              </div>

              {/* Progress Bar */}
               <div className="group relative pt-2">
                <div 
                  className="h-1 bg-gray-700 rounded-full cursor-pointer hover:bg-gray-600 transition-colors"
                  role="progressbar"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-white group-hover:bg-green-500 transition-all relative" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs font-mono text-gray-400">
                   <span>{formatTime(currentTime)}</span>
                   <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Transport Controls */}
              <div className="flex items-center justify-between mt-2">
                 <button onClick={getShuffleIcon === Icons.ShuffleOn ? toggleShuffle : toggleShuffle} 
                    className="hover:scale-105 transition-transform"
                    title={shuffleMode ? "Disable Shuffle" : "Enable Shuffle"}>
                    {getShuffleIcon()}
                 </button>

                 <div className="flex items-center gap-6">
                   <button onClick={playPrevious} className="text-gray-400 hover:text-white transition-colors p-2 active:scale-95">
                     <Icons.Prev />
                   </button>

                   <button 
                      onClick={togglePlay} 
                      className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
                    >
                     {isPlaying ? <Icons.Pause /> : <Icons.Play />}
                   </button>

                   <button onClick={playNext} className="text-gray-400 hover:text-white transition-colors p-2 active:scale-95">
                     <Icons.Next />
                   </button>
                 </div>

                 <button onClick={toggleRepeat} className="hover:scale-105 transition-transform" title="Toggle Repeat">
                    {getRepeatIcon()}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Player (Collapsed) */}
      {!isExpanded && (
        <div className="bg-[#18181b] border-t border-white/10 shadow-2xl">
          
          {/* Main Content Row */}
          <div 
            className="p-3 flex items-center gap-4 hover:bg-[#282828] transition-colors"
          >
            
            {/* 1. Left Section: Art, Info & Transport */}
            <div className="flex items-center gap-4 flex-shrink-0">
              
              {/* Art & Info */}
              <div 
                className="flex items-center gap-3 min-w-0 cursor-pointer"
                onClick={() => setIsExpanded(true)}
              >
                <div className="w-12 h-12 bg-gray-800 rounded shadow flex-shrink-0 overflow-hidden">
                   {coverArt ? (
                     <img src={getCoverImage(coverArt)} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-600">♫</div>
                   )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-white font-semibold truncate text-sm">{title}</h4>
                  <p className="text-gray-400 text-xs truncate">{artist}</p>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="h-6 w-px bg-white/10"></div>
            </div>

            {/* 2. Progress Bar Section (Centered in remaining space) */}
            <div className="flex-1 flex items-center px-4 max-w-md mx-auto">
              <span className="text-[10px] text-gray-400 font-mono w-8 text-right mr-2">{formatTime(currentTime)}</span>
              
              <div className="flex-1 mx-2 group relative cursor-pointer" onClick={handleProgressClick}>
                <div className="h-0.5 bg-gray-600 rounded-full overflow-hidden hover:h-1 transition-all">
                  <div 
                    className="h-full bg-white group-hover:bg-green-500 transition-colors" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <span className="text-[10px] text-gray-400 font-mono w-8 ml-2">{formatTime(duration)}</span>
            </div>

            {/* 3. Transport Controls (Right of Middle) */}
            <div className="flex items-center gap-3">
              <button onClick={playPrevious} className="text-gray-400 hover:text-white transition-colors p-1">
                <Icons.Prev />
              </button>

              <button 
                onClick={togglePlay} 
                className="w-9 h-9 flex items-center justify-center text-white hover:text-green-500 transition-colors"
              >
                {isPlaying ? <Icons.Pause /> : <Icons.Play />}
              </button>

              <button onClick={playNext} className="text-gray-400 hover:text-white transition-colors p-1">
                <Icons.Next />
              </button>
            </div>

            {/* 4. Action Buttons (Far Right) */}
            <div className="flex items-center gap-3 ml-3 border-l border-white/10 pl-3">
              <button 
                onClick={() => { /* Implement View Queue */ }} 
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="View Queue"
              >
                <Icons.Queue />
              </button>
              
              {currentTrackMetadata && (
                <PlaybarOptionsMenu
                  track={currentTrackMetadata}
                  buttonClassName="text-gray-400 hover:text-white transition-colors p-1"
                />
              )}
              
              {/* Expand/Collapse Button */}
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="text-gray-400 hover:text-white transition-colors p-1"
                title={isExpanded ? "Minimize" : "Expand"}
              >
                <Icons.ChevronDown />
              </button>
            </div>
        </div>
      </div>
      )}
    </div>
  );
}
