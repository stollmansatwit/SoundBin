import React from "react";

export type Album = {
  album_id: string;
  title: string;
  cover_art_url?: string;
};

interface Props {
  album: Album;
  onClose: () => void;
}

export default function AlbumPopUp({ album, onClose }: Props) {
  // Update to album get tracks api
  const songs = ["Track 1", "Track 2", "Track 3"]; 


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
            src={album.cover_art_url ? `http://localhost:3000/assets/${album.cover_art_url.split('/').pop()}` : "/defaultAlbum.png"} 
            alt={album.title}
            className="w-48 h-48 rounded-full mb-4 border-4 border-white"
          />
          <h2 className="text-2xl font-bold text-white mb-4">{album.title}</h2>
          
          <div className="w-full">
            <h3 className="text-gray-400 mb-2">Tracklist:</h3>
            <ul className="space-y-2">
              {songs.map((song, index) => (
                <li key={index} className="text-white border-b border-gray-800 pb-1">
                  {song}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}