import { useEffect, useState } from 'react'
import type { Album, Artist } from '../../types';
import { API_BASE_URL } from '../../config';
import ArtistPopUp from '../popUpPage/ArtistPopUp';



type CombinedItem = {
  artist_id: number;
  artistName: string;
  albumCount: number;
};


export function ArtistGrid() {
  const [artists, setArtists] = useState<Artist[]>([]);
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
  const displayArtists = Array.isArray(artists) ? artists : [];

  // TODO: replace MOCK_ARTISTS with data fetched from the library API
  return (
    <>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {displayArtists.map((item) => (
          <button
            key={item.artist_id}
            onClick={() => setSelectedArtist(item)}
            className="group flex flex-col items-center text-center rounded-lg p-2 border-2 border-gray-200 hover:border-orange-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 focus-visible:outline-offset-2"
          >
            <p className="mt-2 truncate text-sm font-bold text-gray-900">{item.name}</p>
            {/* <p className="text-xs font-normal text-gray-500">{} album</p> */}
          </button>
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