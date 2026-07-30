import { useCallback, useEffect, useRef, useState } from "react";
import { PlayButton } from "../buttons/PlayButton";
import { TrackOptionsMenu } from "../buttons/TrackOptionsMenu";
import {type Album, type Track} from "../../types";
import { API_BASE_URL } from '../../config';
import { createPortal } from "react-dom";

interface Props {
  album_id: number;
  track: Track;
  onClose: () => void;
}

export default function SongPopUp({ track, album_id, onClose }: Props) {
  const [artistName, setArtistName] = useState<string>("");
  const [albumName, setAlbumName] = useState<string>("");
  const [artistId, setArtistID] = useState<number>(0);
  const [song, setSong] = useState<Track | null>(null);

  // Handle closing when clicking outside the modal content
  const overlayRef = useRef<HTMLDivElement>(null);



  const getCoverImage = (path?: string) => {
    if (!path) return "/defaultAlbum.png";
    const file = path.split("/").pop();
    return `${API_BASE_URL}/assets/${file}`;
  };

  const coverSrc = getCoverImage((song ?? track).cover_art_url);

  const refreshSong = useCallback(() => {
    fetch(`${API_BASE_URL}/api/tracks/${track.track_id}`)
      .then((res) => res.json())
      .then((data: Track) => {
        setSong(data || null);
      })
      .catch((err) => {
        console.error("Failed to fetch track:", err);
      });

      // Fetch artist name if artist_id exists
    if (track.track_id) {
      fetch(`${API_BASE_URL}/api/track-artist?trackID=${track.track_id}`)
        .then((res) => res.json())
        .then((data: any) => {
          setArtistName(data.contributors[0].artist.name || "Unknown Artist");
          setArtistID(data.contributors[0].artist.artist_id)
        })
        .catch(err => console.error("Failed to fetch artist:", err));

      fetch(`${API_BASE_URL}/api/album-title?albumID=${album_id}`)
        .then((res) => res.json())
        .then((data: Album) => {
          setAlbumName(data.title);
        })
        .catch((error) => {
          console.error('Failed to fetch track:', error)
        });
    }
  }, [track.track_id, album_id]);

  useEffect(() => {
    refreshSong();
  }, [refreshSong]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle click on overlay to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (overlayRef.current && e.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 center bg-black/80 backdrop-blur-md flex items-center justify-center overflow-y-auto z-50 p-4"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-700 shadow-2xl">
        {/* Ambient glow pulled from the artwork, sitting behind everything */}
        <div
          className="absolute inset-0 scale-125 opacity-80 blur-3xl"
          style={{
            backgroundImage: `url(${coverSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Dark scrim + extra blur on top of the glow so text stays readable */}
        <div className="absolute inset-0 bg-black/55 backdrop-blur-md" />

        {/* Content */}
        <div className="relative flex flex-col items-center px-6 sm:px-8 pt-12 sm:pt-14 pb-6 sm:pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <img
            src={coverSrc}
            alt={song ? song.title : "Unkown Track"}
            className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 aspect-square object-cover rounded-lg shadow-2xl border-2 border-gray-600 mb-6"
          />

          <h2 className="text-xl sm:text-2xl font-bold text-white text-center leading-tight">
            {song ? song.title : track.title}
          </h2>
          <p className="text-base text-gray-200 mt-2 text-center">
            {artistName || "Loading artist…"}
          </p>
          <p className="text-sm text-gray-300 mt-1 text-center">
            {albumName ? albumName : ""}
          </p>
          {/* make sure that track_id is not null so we can actually play the audio through the player */}
          
          
            {song && (
              <div className="flex items-center gap-3 mt-4">
                <PlayButton
                  trackId={song.track_id}
                  key={song.track_id}
                  albumId={song.album_id}
                  artistId={artistId}
                  index={-1}
                />
                <TrackOptionsMenu
                  track={song}
                  artistId={artistId}
                  artistName={artistName}
                  albumTitle={albumName}
                  onTrackUpdated={refreshSong}
                />
              </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
