import { useEffect, useState } from "react"
import AlbumPopUp from "../popUpPage/AlbumPopUp"
import { type Album } from "../../types"



const DEFAULT_IMAGE = "/defaultAlbum.png"; // change to an actual path in assets once better image found

export function AlbumGrid() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // useEffect to call backend api/album-path
  useEffect(() => {
    const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

    fetch(`${apiBaseUrl}/api/album-path`)
      .then((response) => {
        if (!response.ok) {
          console.log(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Album[]) => {
        setAlbums(data);
      })
      .catch((error) => {
        console.error("Failed to fetch albums:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getCoverImage = (path?: string) => {
    const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;
    if (!path || path == "" || path == null) {
      return DEFAULT_IMAGE;
    }

    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };



  // TODO: replace MOCK_ALBUMS with data fetched from the library API
  return (
    <>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {albums.map((album) => (
          <button
            key={album.album_id}
            className="group text-left rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 focus-visible:outline-offset-2"
          >
            <div
              className={`aspect-square w-full rounded-lg bg-linear-to-br ${album.cover_art_url ? 'bg-cover' : 'bg-gray-300'} shadow-md transition-transform duration-200 group-hover:scale-[1.03] group-hover:shadow-lg`}>
              <img
                key={album.album_id}
                onClick={() => setSelectedAlbum(album)}
                src={getCoverImage(album.cover_art_url)}
                alt={album.title}
              />
            </div>
            <p className="mt-2 truncate text-sm font-bold text-gray-900">{album.title}</p>
            <p className="truncate text-xs font-normal text-gray-500">{album.release_date && new Date(album.release_date).getFullYear()}</p>
          </button>
        ))}


      </div>
      {selectedAlbum && (
        <AlbumPopUp
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
        />
      )}
    </>
  )
}