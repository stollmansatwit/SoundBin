import {useEffect, useState} from "react";
import { PlayButton } from "../buttons/PlayButton";
import { type Album } from "../../types";
import { type Track } from "../../types";

interface Props {
  album: Album;
  onClose: () => void;
}

export default function AlbumPopUp({ album, onClose}: Props) {
  const [songs, setSongs] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [artistName, setArtistName] = useState<string>("");

  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  useEffect(() => {
    if (!album?.album_id) return;
    setLoadingTracks(true);
    fetch(`${apiBaseUrl}/api/album-track-list?id=${album.album_id}`)
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
      fetch(`${apiBaseUrl}/api/artist-name?id=${album.artist_id}`)
        .then((res) => res.json())
        .then((data: any) => {
          // Assuming the response is { name: "Artist Name" } or similar
          setArtistName(data.name || "Unknown Artist");
        })
        .catch(err => console.error("Failed to fetch artist:", err));
    }
  }, [album?.album_id]);


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
    return `${apiBaseUrl}/assets/${file}`;
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
    <div className="text-sm text-gray-500 mb-6 border-b border-gray-700 pb-4">
      {songs.length} songs &nbsp;•&nbsp; {totalDuration} {displayYear ? `   •   ${displayYear}`:''} 
    </div>
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      onClose();
    }
  });

  // still needs updates but good starter
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full relative shadow-2xl overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-red-600 px-4 py-1 rounded-md hover:bg-red-700 transition-colors z-10"
        >
          Close
        </button>
        
        <div className="flex flex-col md:flex-row">
          {/* Left Side: Artwork & Info */}
          <div className="p-8 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-center border-r border-gray-700 w-full md:w-1/3">
            <img 
              src={getCoverImage(album.cover_art_url)} 
              alt={album.title}
              className="w-64 h-64 aspect-square object-cover rounded-lg shadow-2xl border-2 border-gray-600 mb-4"
            />
            <h2 className="text-2xl font-bold text-white text-center">{album.title}</h2>
          </div>

          {/* Right Side: Tracklist */}
          <div className="p-8 w-full md:w-2/3 bg-gray-900">
            <h3 className="text-3xl font-bold text-white mb-1">{album.title}</h3>
            <p className="text-lg text-gray-400 mb-1">{artistName || "Loading Artist..."}</p>
            
            {/* Info Bar: [# songs - duration - year (optional)] */}
            {infoBar}

            <div className="w-full overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              <ul className="space-y-1">
                {loadingTracks ? (
                  <li key="loading" className="text-white opacity-50 italic">Loading tracks...</li>
                ) : songs.length > 0 ? (
                  songs.map((song) => (
                    <li key={song.track_id} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-none hover:bg-white/5 px-2 rounded transition-colors">
                      {/* Left side: Track Number and Title */}
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 text-sm w-6">
                          {song.albumSequence?.[0]?.sequence_number || songs.indexOf(song) + 1}
                        </span>
                        <span className="text-white font-medium">{song.title}</span>
                      </div>

                      {/* Right side: Duration and Play Button */}
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">
                          {formatDuration(song.duration)}
                        </span>
                        <PlayButton
                          trackId={song.track_id}
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