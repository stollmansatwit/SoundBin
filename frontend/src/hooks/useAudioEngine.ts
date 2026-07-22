import { useState, useEffect, useRef } from 'react';
import { AudioEngine} from '../audio/AudioEngine';
import type {AudioEngineState, AudioContextType, AudioEngineOptions} from '../types';
import type { Track } from '../types';

/**
 * A thin React hook that bridges the singleton AudioEngine to React state.
 */
export function useAudioEngine(options: AudioEngineOptions): AudioContextType {
  const engineRef = useRef<AudioEngine>(null!); // Non-null assertion because we init immediately if needed

  // Initialize or get existing singleton
  if (!engineRef.current) {
    engineRef.current = AudioEngine.getInstance(options);
  }

  const [state, setState] = useState<AudioEngineState>(engineRef.current.getState());

  useEffect(() => {
    const engine = engineRef.current;
    
    // Subscribe to state changes from the engine
    const unsubscribe = engine.subscribe((newState) => {
      setState(newState as AudioEngineState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Return the full context including state and methods
  return {
    ...state,
    setQueue: (tracks: Track[]) => engineRef.current.setQueue(tracks),
    toggleShuffle: () => engineRef.current.toggleShuffle(),
    toggleRepeat: () => engineRef.current.toggleRepeat(),
    playNext: () => engineRef.current.playNext(),
    playPrevious: () => engineRef.current.playPrevious(),
    pause: () => engineRef.current.pause(),
    togglePlay: () => engineRef.current.togglePlay(),
  };
}