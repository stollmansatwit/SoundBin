import React, { createContext, useContext, useMemo } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';

interface AudioContextType {
  isPlaying: boolean;
  currentTrackId: number | null;
  currentTime: number;
  duration: number;
  error: string | null;
  play: (trackId: number) => void;
  pause: () => void;
  togglePlay: (trackId: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

interface AudioProviderProps {
  children: React.ReactNode;
  // Provide this function from your app to resolve track URLs
  getTrackUrl: (trackId: number) => string | null;
}

export function AudioProvider({ children, getTrackUrl }: AudioProviderProps) {
  const audioEngine = useAudioEngine({ getTrackUrl });

  return (
    <AudioContext.Provider value={audioEngine}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}