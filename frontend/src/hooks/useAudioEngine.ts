/**
 * Manages the HTML5 audio object internally
 * Handles track URL resolution based on trackId
 * Provides state management for play/pause status
 * returns functions and state for components to consume
 */

import { useState, useEffect, useRef } from 'react';

interface AudioEngineOptions {
  // URL resolution function - maps trackId to actual audio URL
  getTrackUrl: (trackId: number) => string | null;
}

interface AudioState {
  isPlaying: boolean;
  currentTrackId: number | null;
  currentTime: number;
  duration: number;
  error: string | null;
}

export function useAudioEngine(options: AudioEngineOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTrackId: null,
    currentTime: 0,
    duration: 0,
    error: null,
  });

  useEffect(() => {
    // Create audio element on mount
    const audio = new Audio();
    audioRef.current = audio;

    // Set up event listeners
    audio.addEventListener('timeupdate', () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    });

    audio.addEventListener('loadedmetadata', () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    });

    audio.addEventListener('error', (e) => {
      console.error('[AudioEngine] Playback error:', e);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load audio',
        isPlaying: false 
      }));
    });

    audio.addEventListener('ended', () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTrackId: null }));
    });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const play = async (trackId: number) => {
    try {
      if (!audioRef.current) return;

      let url: string | null;
      const result = options.getTrackUrl?.(trackId);

      if (result instanceof Promise) {
        url = await result;
      } else {
        url = result;
      }

      if (!url){ throw new Error(`No audio source found for track ${trackId}`); }
    
      audioRef.current.pause();
      
      // Set new source and play
      audioRef.current.src = url;
      await audioRef.current.play();
      
      setState(prev => ({ 
        ...prev, 
        isPlaying: true, 
        currentTrackId: trackId,
        error: null 
      }));
    } catch (error) {
      console.error('[AudioEngine] Play error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to play audio',
        isPlaying: false 
      }));
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  const togglePlay = (trackId: number) => {
    if (state.isPlaying && state.currentTrackId === trackId) {
      pause();
    } else {
      play(trackId);
    }
  };

  return {
    ...state,
    play,
    pause,
    togglePlay,
    audioRef: () => audioRef.current,
  };
}