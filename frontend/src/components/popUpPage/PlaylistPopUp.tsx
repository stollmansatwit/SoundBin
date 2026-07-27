import { useEffect, useMemo, useRef, useState } from "react";
import { PlayPlaylist } from "../buttons/PlayPlaylist";
import { TrackOptionsMenu } from "../buttons/TrackOptionsMenu";
import { useAudio } from "../../context/AudioContext";
import type { Playlist, Track } from "../../types";

interface Props {
  playlist: Playlist;
  onClose: () => void;
  /** Called when the playlist is deleted from the options menu, in addition to onClose. */
  onDeleted?: () => void;
}

const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

type TrackArtistInfo = { artist_id: number | null; name: string };

export default function PlaylistPopUp({ playlist, onClose, onDeleted }: Props) {
  const { setQueue, togglePlay, currentTrackId, isPlaying } = useAudio();
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist>(playlist);
  const [songs, setSongs] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [trackArtists, setTrackArtists] = useState<Record<number, TrackArtistInfo>>({});

  // Handle closing when clicking outside the modal content
  const overlayRef = useRef<HTMLDivElement>(null);

  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  useEffect(() => {
    setCurrentPlaylist(playlist);
  }, [playlist]);

  useEffect(() => {
    if (!currentPlaylist?.playlist_id) return;
    setLoadingTracks(true);

    fetch(`${apiBaseUrl}/api/playlist-tracks?id=${currentPlaylist.playlist_id}`)
      .then((res) => res.json())
      .then((data: Track[] = []) => {
        setSongs(data);
        setLoadingTracks(false);

        // Resolve the contributing artist for each track individually —
        // unlike an album, a playlist's tracks can each belong to a
        // different artist/album.
        Promise.all(
          data.map((track) =>
            fetch(`${apiBaseUrl}/api/track-artist?trackID=${track.track_id}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((artistData) => {
                const contributor = artistData?.contributors?.[0]?.artist;
                return [track.track_id, {
                  artist_id: contributor?.artist_id ?? null,
                  name: contributor?.name ?? "Unknown Artist",
                }] as const;
              })
              .catch(() => [track.track_id, { artist_id: null, name: "Unknown Artist" }] as const)
          )
        ).then((entries) => {
          setTrackArtists(Object.fromEntries(entries));
        });
      })
      .catch((err) => {
        console.error("Failed to fetch playlist tracks:", err);
        setLoadingTracks(false);
      });
  }, [currentPlaylist?.playlist_id]);

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

  const getYear = (date: any) => {
    if (!date) return null;
    if (typeof date === 'string') {
      return date.substring(0, 4);
    }
    const d = new Date(date);
    return d.getFullYear().toString();
  };

  // Logic to handle optional year & duration in the info bar
  const displayYear = getYear(currentPlaylist.date_created);
  const totalDuration = formatTotalDuration(songs.reduce((acc, s) => acc + (s.duration || 0), 0));

  // Unlike an album, each track in a playlist can have a different
  // artist, so the plain `songs` list (as returned by the API) has no
  // `artist` field set on it. This attaches the artist name resolved
  // per-track above, so anything that queues/plays these tracks shows
  // the right artist in the playback bar.
  const songsWithArtist = useMemo(
    () => songs.map((song) => ({
      ...song,
      artist: trackArtists[song.track_id]?.name || song.artist || "Unknown Artist",
    })),
    [songs, trackArtists]
  );

  const infoBar = (
    <div className="text-sm text-gray-300 mb-6 border-b border-gray-700 pb-4">
      {songs.length} songs &nbsp;•&nbsp; {totalDuration} {displayYear ? `   •   ${displayYear}` : ''}
    </div>
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const getCoverImage = (path?: string) => {
    if (!path || path == "" || path == null) { return DEFAULT_IMAGE; }
    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  const coverSrc = getCoverImage(currentPlaylist.cover_art_url);

  // Handle click on overlay to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (overlayRef.current && e.target === overlayRef.current) {
      onClose();
    }
  };

  return (

    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
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
          <div className="p-8 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-center border-r border-gray-700 w-full md:w-1/3 ">
            <img
              src={coverSrc}
              alt={currentPlaylist.name}
              className="w-64 h-64 aspect-square object-cover rounded-lg shadow-2xl border-2 border-gray-600 mb-4"
            />
            <h2 className="text-2xl font-bold text-white text-center">{currentPlaylist.name}</h2>
            <PlayPlaylist
              playlist={currentPlaylist}
              tracks={songsWithArtist}
              onPlaylistUpdated={setCurrentPlaylist}
              onDeleted={() => { onDeleted?.(); onClose(); }}
            />
          </div>

          {/* Right Side: Tracklist */}
          <div className="p-8 w-full md:w-2/3 bg-transparent relative z-0 overflow-hidden">

            {/* Blurred background layer (the playlist art itself) */}
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

            <h3 className="text-3xl font-bold text-white mb-1">{currentPlaylist.name}</h3>
            {currentPlaylist.description && (
              <p className="text-sm text-gray-300 mb-1">{currentPlaylist.description}</p>
            )}

            {/* Info Bar: [# songs - duration - year (optional)] */}
            {infoBar}

            <div className="w-full overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              <ul className="space-y-1">
                {loadingTracks ? (
                  <li key="loading" className="text-white opacity-50 italic">Loading tracks...</li>
                ) : songsWithArtist.length > 0 ? (
                  songsWithArtist.map((song, idx) => (
                    <li key={song.track_id} className="flex items-center justify-between py-3 border-b border-gray-700/60 last:border-none hover:bg-white/10 px-2 rounded transition-colors">
                      {/* Left side: Track Number and Title */}
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-gray-300 text-sm w-6">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="text-white font-medium block truncate">{song.title}</span>
                          <span className="text-gray-300 text-xs block truncate">
                            {trackArtists[song.track_id]?.name || "Loading..."}
                          </span>
                        </div>
                      </div>

                      {/* Right side: Duration and Play Button */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-gray-300 text-sm">
                          {formatDuration(song.duration || 0)}
                        </span>
                        <button
                          onClick={() => {
                            if (isPlaying && currentTrackId === song.track_id) {
                              togglePlay();
                              return;
                            }
                            setQueue(songsWithArtist, idx);
                            togglePlay();
                          }}
                          className={`relative bg-white/10 p-2 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-200 border ${
                            isPlaying && currentTrackId === song.track_id ? 'border-blue-500' : 'border-white/10'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          aria-label={isPlaying && currentTrackId === song.track_id ? "Pause" : `Play ${song.title}`}
                        >
                          <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                            {isPlaying && currentTrackId === song.track_id ? (
                              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                            ) : (
                              <path d="M8 5v14l11-7z" />
                            )}
                          </svg>
                        </button>
                        <TrackOptionsMenu
                          track={song}
                          artistId={trackArtists[song.track_id]?.artist_id}
                          artistName={trackArtists[song.track_id]?.name}
                        />
                      </div>

                    </li>

                  ))
                ) : (
                  <li key="empty" className="text-gray-500">No tracks found.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
