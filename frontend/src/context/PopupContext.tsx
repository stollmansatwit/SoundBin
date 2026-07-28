import React, { createContext, useCallback, useContext, useState } from 'react';
import AlbumPopUp from '../components/popUpPage/AlbumPopUp';
import ArtistPopUp from '../components/popUpPage/ArtistPopUp';
import PlaylistPopUp from '../components/popUpPage/PlaylistPopUp';
import type { Album, Artist, Playlist } from '../types';
import { API_BASE_URL } from '../config';


type ActivePopup =
  | { type: 'album'; data: Album }
  | { type: 'artist'; data: Artist }
  | { type: 'playlist'; data: Playlist }
  | null;

interface PopupContextType {
  openAlbum: (albumId: number) => Promise<void>;
  openArtist: (artistId: number) => Promise<void>;
  openPlaylist: (playlist: Playlist | number) => Promise<void>;
  closePopup: () => void;
}

const PopupContext = createContext<PopupContextType | null>(null);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<ActivePopup>(null);

  const openAlbum = useCallback(async (albumId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/album/${albumId}`);
      if (!res.ok) throw new Error('Failed to fetch album');
      const album: Album = await res.json();
      setActive({ type: 'album', data: album });
    } catch (error) {
      console.error('[PopupContext] Failed to open album:', error);
    }
  }, []);

  const openArtist = useCallback(async (artistId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/artist/${artistId}`);
      if (!res.ok) throw new Error('Failed to fetch artist');
      const artist: Artist = await res.json();
      setActive({ type: 'artist', data: artist });
    } catch (error) {
      console.error('[PopupContext] Failed to open artist:', error);
    }
  }, []);

  const openPlaylist = useCallback(async (playlist: Playlist | number) => {
    if (typeof playlist !== 'number') {
      setActive({ type: 'playlist', data: playlist });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/playlist/${playlist}`);
      if (!res.ok) throw new Error('Failed to fetch playlist');
      const data: Playlist = await res.json();
      setActive({ type: 'playlist', data });
    } catch (error) {
      console.error('[PopupContext] Failed to open playlist:', error);
    }
  }, []);

  const closePopup = useCallback(() => setActive(null), []);

  return (
    <PopupContext.Provider value={{ openAlbum, openArtist, openPlaylist, closePopup }}>
      {children}
      {active?.type === 'album' && <AlbumPopUp album={active.data} onClose={closePopup} />}
      {active?.type === 'artist' && <ArtistPopUp artist={active.data} onClose={closePopup} />}
      {active?.type === 'playlist' && <PlaylistPopUp playlist={active.data} onClose={closePopup} />}
    </PopupContext.Provider>
  );
}

export function usePopups(): PopupContextType {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopups must be used within a PopupProvider');
  }
  return context;
}
