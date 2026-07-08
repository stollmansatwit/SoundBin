import React, {useEffect, useState} from "react";

export type Album = {
  album_id: string;
  artist_id: string;
  title: string;
  cover_art_url?: string;
};

interface Props {
  album: Album;
  onClose: () => void;
}

export default function AlbumPopUp({ album, onClose }: Props) {
  const [songs, setSongs] = useState<{title: string}[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);

  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  useEffect(() => {
    if (!album?.album_id) return;
    setLoadingTracks(true);
    fetch(`${apiBaseUrl}/api/album-track-list?id=${album.album_id}`)
      .then((res) => res.json())
      .then((data: {title: string}[] = []) => {
        setSongs(data);
        setLoadingTracks(false);
      })
      .catch((err) => {
        console.error("Failed to fetch tracks:", err);
        setLoadingTracks(false)
      });
  }, [album?.album_id]);

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
            src={album.cover_art_url ? `${apiBaseUrl}/assets/${album.cover_art_url.split('/').pop()}` : "/defaultAlbum.png"} 
            alt={album.title}
            className="w-48 h-48 rounded-full mb-4 border-4 border-white"
          />
          <h2 className="text-2xl font-bold text-white mb-4">{album.title}</h2>
          
          <div className="w-full">
            <h3 className="text-gray-400 mb-2">Tracklist:</h3>
            <ul className="space-y-2">
              {loadingTracks ? (
                <li className="test-white opacity-50">Loading tracks...</li>
              ) : songs.length > 0 ? (
                songs.map((song, index) => (
                  <li key={index} className="text-white border-b border-gray-800 pb-1 last:border-none">
                    {song.title}
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