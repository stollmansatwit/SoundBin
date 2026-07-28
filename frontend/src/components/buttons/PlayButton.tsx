import React, {useState} from "react";
import { useAudio } from "../../context/AudioContext";
import type { Track } from "../../types"
import { API_BASE_URL } from '../../config';

interface PlayButtonProps {
  trackId: number;
  albumId: number;
  artistId: number | null;
  index: number;
  className?: string; // Optional for extra styling control
}

/**
 * Uses Audio Context to play audio selected
 * 
 * Selcets correct audio by using trackId, which is passed to useAudio
 */
export function PlayButton({ trackId, albumId, artistId, index,  className = "" }: PlayButtonProps) {
  const { togglePlay, currentTrackId, isPlaying, setQueue } = useAudio();


  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  
  const handleClick = async () => {
      // If currently playing this track, just toggle play/pause (instant)
    if (isPlaying && currentTrackId === trackId) {
      togglePlay();
      return;
    }

    setIsLoading(true);
    setHasError(false);

    if (index >= 0 ) { // add album to queue, previous and next
      try {
        if (!artistId) return;
        let artistName = "Unknown Artist";
        try{
          const response = await fetch (`${API_BASE_URL}/api/artist-name?id=${artistId}`);
          if (!response.ok) throw new Error(`Failed to fetch artist name: ${response.statusText}`);
          const rawArtistName = await response.json();
          artistName = rawArtistName.name || "Unknown Artist";
        } catch (error) {
          console.error("[PlayButton] Error fetching artist name:", error);
        }
        const response = await fetch(`${API_BASE_URL}/api/album-track-list?id=${albumId}`);
        if (!response.ok) throw new Error(`Failed to fetch album tracks: ${response.statusText}`);
        const albumTracksRaw = await response.json()
        const albumTracks: Track[] = albumTracksRaw.map((rawTrack: any) => ({
          track_id: rawTrack.track_id,
          album_id: rawTrack.album_id || albumId,
          title: rawTrack.title,
          artist: artistName|| "Unknown Artist",
          duration: rawTrack.duration,
          cover_art_url: rawTrack.cover_art_url,
          files: rawTrack.files ? [{ storage_path_url: rawTrack.files[0]?.storage_path_url }] : undefined,
          albumSequence: rawTrack.albumSequence?.[0]?.sequence_number ? [{ sequence_number: rawTrack.albumSequence[0]?.sequence_number }] : [{ sequence_number: 0 }]
        }));
        setQueue(albumTracks, index);
        togglePlay()
      } catch (error) {
        console.error("[PlayButton] Error fetching album tracks:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    } else { // index = -1, playing just 1 song, so just play it
      if (!artistId) return;
      let artistName = "Unknown Artist";
      try{
        const response = await fetch (`${API_BASE_URL}/api/artist-name?id=${artistId}`);
        if (!response.ok) throw new Error(`Failed to fetch artist name: ${response.statusText}`);
        const rawArtistName = await response.json();
        artistName = rawArtistName.name || "Unknown Artist";
      } catch (error) {
        console.error("[PlayButton] Error fetching artist name:", error);
      }
      if (!trackId) return;
      try{
        const response = await fetch (`${API_BASE_URL}/api/tracks/${trackId}`);
        if (!response.ok) throw new Error(`Failed to fetch track: ${response.statusText}`);
        const rawData = await response.json();
        const trackData: Track = {
          track_id: rawData.track_id,
          album_id: rawData.album_id || albumId,
          title: rawData.title,
          artist: artistName,
          duration: rawData.duration,
          cover_art_url: rawData.cover_art_url, // Extract from nested album
          files: rawData.files ? [{ storage_path_url: rawData.files[0]?.storage_path_url }] : undefined,
          albumSequence: rawData.albumSequence[0]?.sequence_number ? [{ sequence_number: rawData.albumSequence[0]?.sequence_number}] : [{sequence_number: 0}]
        };

        setQueue([trackData]);
        togglePlay();
        } catch (error) {
          console.error("[PlayButton] Error fetching track:", error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      



    }
  };

  const isActive = isPlaying && currentTrackId === trackId;



  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        relative bg-white/10 p-2 rounded-full hover:bg-white/20 
        active:bg-white/30 transition-all duration-200
        border ${isActive ? 'border-blue-500' : (hasError ? 'border-red-500' : 'border-white/10')} 
        focus:outline-none focus:ring-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={isActive ? "Pause" : `Play track ${trackId}`}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {/* Icon */}
      <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 relative z-10">
        {isActive ? (
          // Pause icon when playing this track
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        ) : (
          // Play icon when not playing
          <path d="M8 5v14l11-7z" />
        )}
      </svg>
    </button>
  );
}
