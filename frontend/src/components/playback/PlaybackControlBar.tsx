import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';

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
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTrackId) return null; // Don't render anything if no track is playing

  const title = currentTrackMetadata?.title || `Track #${currentTrackId}`;
  const artist = currentTrackMetadata?.artist || "Unknown Artist";
  const coverArt = currentTrackMetadata?.cover_art_url || "";
  console.log(JSON.stringify(currentTrackMetadata));

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
                 <img src={coverArt} alt="Album Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
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
           {/* Mini Progress Bar */}
           <div className="h-0.5 w-full bg-gray-700 cursor-pointer hover:h-1 transition-all">
              <div className="h-full bg-green-500" style={{ width: `${progress}%` }} />
           </div>

           <div 
             className="p-3 flex items-center gap-4 cursor-pointer hover:bg-[#282828] transition-colors"
             onClick={() => setIsExpanded(true)}
            >
            
            {/* Mini Art */}
            <div className="w-14 h-14 bg-gray-800 rounded shadow flex-shrink-0 overflow-hidden">
               {coverArt ? (
                 <img src={coverArt} alt="" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-600">♫</div>
               )}
            </div>

            {/* Mini Info */}
            <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] items-center gap-4">
               <div className="overflow-hidden">
                 <h4 className="text-white font-semibold truncate">{title}</h4>
                 <p className="text-gray-400 text-xs truncate">{artist}</p>
               </div>
            </div>

            {/* Mini Controls */}
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="w-10 h-10 flex items-center justify-center text-white hover:text-green-500 transition-colors"
            >
               {isPlaying ? <Icons.Pause /> : <Icons.Play />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
