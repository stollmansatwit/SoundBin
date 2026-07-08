import React, {useEffect, useState} from "react";

type Album = {
  album_id: string;
  artist_id: string;
  title: string;
  cover_art_url?: string;
};

type Track = {
  title: string;
  duration: number;
  albumSequence?: {sequence_number: number}[];
}

interface Props {
  album: Album;
  onClose: () => void;
}

export default function AlbumPopUp({ album, onClose }: Props) {
  const [songs, setSongs] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);

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
  }, [album?.album_id]);


  // Helper Functions
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const getCoverImage = (path?: string) => {
    if (!path || path == "" || path == null) {
      return "/defaultAlbum.png";
    }
    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  const getSequenceNumber = () => {

  }
  
  // still needs updates but good starter
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/80 p-6 rounded-lg max-w-md w-full relative border border-gray-700 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-red-500 px-2 py-1 rounded"
        >
          Close
        </button>
        
        <div className="flex flex-col items-center">
          <img 
            src={getCoverImage(album.cover_art_url)} 
            alt={album.title}
            className="w-48 h-48 rounded-full mb-4 border-4 border-white"
          />
          <h2 className="text-2xl font-bold text-white mb-4">{album.title}</h2>
          
          <div className="w-full">
            <h3 className="text-gray-400 mb-2">Tracklist:</h3>
            <ul className="space-y-2">
              {loadingTracks ? (
                <li className="text-white opacity-50">Loading tracks...</li>
              ) : songs.length > 0 ? (
                songs.map((song, index) => (
                  <li key={index} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-none">

                    {/* Left side: Track Number and Title */}
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 text-sm w-4">{song.albumSequence?.[0]?.sequence_number ? song.albumSequence?.[0]?.sequence_number : index + 1}</span>
                      <span className="text-white font-medium">{song.title}</span>
                    </div>

                    {/* Right side: Duration and Play Button */}
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm ml-auto">
                        {formatDuration(song.duration)}
                      </span>
                      <button className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                         {/* Placeholder for Play Button Icon */}
                        <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No tracks found.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}