// frontend/src/context/AudioContext.tsx
import React, { createContext, useContext } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { AudioEngine } from '../audio/AudioEngine';
import type { AudioContextType, AudioEngineState } from '../types';

// Define the context interface using our new state and action types

const AudioContext = createContext<AudioContextType | null>(null);

interface AudioProviderProps {
  children: React.ReactNode;
  getTrackUrl: (storage_path_url: string) => string | Promise<string | null>;
}

export function AudioProvider({ children, getTrackUrl }: AudioProviderProps) {
  // This hook now returns the extended state and methods from AudioEngine
  const audioAPI = useAudioEngine({ getTrackUrl });

  return (
    <AudioContext.Provider value={audioAPI as AudioContextType}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextType {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}