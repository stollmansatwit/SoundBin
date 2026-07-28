import { useEffect, useRef, useState } from "react";
import { PlayButton } from "../buttons/PlayButton";
import { PlayAlbum } from "../buttons/PlayAlbum";
import { TrackOptionsMenu } from "../buttons/TrackOptionsMenu";
import type { Album, Track } from "../../types";
import { API_BASE_URL } from '../../config';

interface Props {
  album: Album;
  onClose: () => void;
  /** Called when the album is deleted from the options menu, in addition to onClose. */
  onDeleted?: () => void;
}

export default function AlbumPopUp({ album, onClose, onDeleted }: Props) {
  const [songs, setSongs] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [artistName, setArtistName] = useState<string>("");

  // Handle closing when clicking outside the modal content
  const overlayRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!album?.album_id) return;
    setLoadingTracks(true);
    fetch(`${API_BASE_URL}/api/album-track-list?id=${album.album_id}`)
      .then((res) => res.json())
      .then((data: Track[] = []) => {

        setSongs(data);
        setLoadingTracks(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tracks:", err);
        setLoadingTracks(false)
      });

    // Fetch artist name if artist_id exists
    if (album.artist_id) {
      fetch(`${API_BASE_URL}/api/artist-name?id=${album.artist_id}`)
        .then((res) => res.json())
        .then((data: any) => {
          // Assuming the response is { name: "Artist Name" } or similar
          setArtistName(data.name || "Unknown Artist");
        })
        .catch(err => console.error("Failed to fetch artist:", err));
    }
  }, [album?.album_id]);

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

  // Helper Functions
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const formatTotalDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCoverImage = (path?: string) => {
    if (!path || path == "" || path == null) {
      return "/defaultAlbum.png";
    }
    const file = path.split('/').pop();
    return `${API_BASE_URL}/assets/${file}`;
  };

  const getYear = (date: any) => {
    if (!date) return null;
    // If it's a string like "2013-01-01...", take first 4 chars
    if (typeof date === 'string') {
      return date.substring(0, 4);
    }
    // If it's a Date object or timestamp
    const d = new Date(date);
    return d.getFullYear().toString();
  };

  // Logic to handle optional year & duration in the info bar
  const displayYear = getYear(album.release_date);
  const totalDuration = formatTotalDuration(songs.reduce((acc, s) => acc + s.duration, 0));

  // Construct the display string: "12 songs • 01:30:00" or "12 songs • 01:30:00 • 2024"
  const infoBar = (
    <div className="text-sm text-gray-300 mb-6 border-b border-gray-700 pb-4">
      {songs.length} songs &nbsp;•&nbsp; {totalDuration} {displayYear ? `   •   ${displayYear}` : ''}
    </div>
  );

  const coverSrc = getCoverImage(album.cover_art_url);
  // still needs updates but good starter
  return (

    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center overflow-y-auto z-50 p-4"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full relative shadow-2xl overflow-hidden">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row">

          {/* Left Side: Artwork & Info */}
          <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-center border-r border-gray-700 w-full md:w-1/3 ">
            <img
              src={getCoverImage(album.cover_art_url)}
              alt={album.title}
              className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 aspect-square object-cover rounded-lg shadow-2xl border-2 border-gray-600 mb-4"
            />
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center">{album.title}</h2>
            <PlayAlbum 
              tracks={songs} 
              album={album}
              artistName={artistName}
              onDeleted={() => { onDeleted?.(); onClose(); }}
            />

          </div>

          {/* Right Side: Tracklist */}
          <div className="p-4 sm:p-6 md:p-8 w-full md:w-2/3 bg-transparent relative z-0 overflow-hidden">

            {/* Blurred background layer (the album art itself) */}
            <div
              className="absolute inset-0 -z-20"
              style={{
                backgroundImage: `url(${coverSrc})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(100px)",
                transform: "scale(1.8)", // hides blurred edges from bleeding outside the container
              }}
            />
            {/* Dark scrim + extra blur on top of the art so text stays readable */}
            <div className="absolute inset-0 -z-10 bg-black/55 backdrop-blur-sm" />

            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{album.title}</h3>
            <p className="text-base sm:text-lg text-gray-300 mb-1">{artistName || "Loading Artist..."}</p>

            {/* Info Bar: [# songs - duration - year (optional)] */}
            {infoBar}

            <div className="w-full overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              <ul className="space-y-1">
                {loadingTracks ? (
                  <li key="loading" className="text-white opacity-50 italic">Loading tracks...</li>
                ) : songs.length > 0 ? (
                  songs.map((song) => (
                    <li key={song.track_id} className="flex items-center justify-between gap-3 py-3 border-b border-gray-700/60 last:border-none hover:bg-white/10 px-2 rounded transition-colors">
                      {/* Left side: Track Number and Title */}
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-gray-300 text-sm w-6 flex-shrink-0">
                          {song.albumSequence?.[0]?.sequence_number || songs.indexOf(song) + 1}
                        </span>
                        <span className="text-white font-medium truncate">
                          {song.title}</span>
                      </div>

                      {/* Right side: Duration and Play Button */}
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <span className="hidden sm:inline text-gray-300 text-sm">
                          {formatDuration(song.duration)}
                        </span>
                        <PlayButton
                          trackId={song.track_id}
                          albumId={song.album_id}
                          artistId={album.artist_id}
                          index={songs.indexOf(song)}
                        />
                        <TrackOptionsMenu
                          track={song}
                          artistId={album.artist_id}
                          artistName={artistName}
                          albumTitle={album.title}
                        />

                      </div>

                    </li>

                  ))
                ) : (
                  <li key="empty" className="text-gray-300">No tracks found.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
