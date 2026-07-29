import { useEffect, useState } from 'react'
import type { Artist } from '../../types';
import { API_BASE_URL } from '../../config';
import ArtistPopUp from '../popUpPage/ArtistPopUp';



type CombinedItem = {
  artist_id: number;
  artistName: string;
  albumCount: number;
};


const DEFAULT_IMAGE = "/defaultAlbum.png";

export function ArtistGrid() {
  const [artists, setArtists] = useState<Artist[]> ([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);




useEffect(() => {
  fetch(`${API_BASE_URL}/api/artist-path`)
    .then((response) => {
      if (!response.ok) {
        console.log(`Request failed with status ${response.status}`);
      }
      return response.json();
    })
    .then((data: Artist[]) => {
      setArtists(data);
    })
    .catch((error) => {
      console.error("Failed to fetch albums:", error);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

const getCoverImage = (path?: string) => {
  if (!path || path == "" || path == null) {
    return DEFAULT_IMAGE;
  }

  const file = path.split('/').pop();
  return `${API_BASE_URL}/assets/${file}`;
};

const displayArtists = Array.isArray(artists) ? artists : [];
  // TODO: replace MOCK_ARTISTS with data fetched from the library API
  return (
    <>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {displayArtists.map((artist) => (
          <div>
          
          <button
            key={artist.artist_id}
            onClick={() => setSelectedArtist(artist)}
            className="group flex flex-col items-center text-center rounded-lg p-2 shadow-lg border-gray-200 hover:border-orange-200 hover:scale-105 hover:bg-white transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 focus-visible:outline-offset-2"
          >
            <img src = {getCoverImage(artist.image_url)}></img>
            <p className="mt-2 truncate text-sm font-bold text-gray-900">{artist.name}</p>
            {/* <p className="text-xs font-normal text-gray-500">{} album</p> */}
          </button>
          </div>
        ))}
      </div>
      {selectedArtist && (
        <ArtistPopUp
          artist={selectedArtist}
          onClose={() => setSelectedArtist(null)}
        />
      )}
    </>
  )
}