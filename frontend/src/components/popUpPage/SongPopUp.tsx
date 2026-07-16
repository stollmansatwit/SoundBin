import { useEffect, useState } from "react";
import { PlayButton } from "../buttons/PlayButton";

export type Album = {
  album_id: string;
  artist_id: string;
  title: string;
  cover_art_url?: string;
};

export type Track = {
  title: string;
  track_id?: number;
};

export type Props = {
  album: Album;
  track: Track;
  onClose: () => void;
}

export default function SongPopUp({ track, album, onClose }: Props) {
  const [artistName, setArtistName] = useState<string>("");
  const [songs, setSongs] = useState<Track[]>([]);

  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  useEffect(() => {
    if (!album?.artist_id) return;
    fetch(`${apiBaseUrl}/api/artist-name?id=${album.artist_id}`)
      .then((res) => res.json())
      .then((data: any) => setArtistName(data.name || "Unknown Artist"))
      .catch((err) => console.error("Failed to fetch artist:", err));
  }, [album?.artist_id]);

  const getCoverImage = (path?: string) => {
    if (!path) return "/defaultAlbum.png";
    const file = path.split("/").pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  const coverSrc = getCoverImage(album.cover_art_url);
  useEffect(() => {
    if (!album?.album_id) return;
    fetch(`${apiBaseUrl}/api/album-track-list?id=${album.album_id}`)
      .then((res) => res.json())
      .then((data: Track[] = []) => {

        setSongs(data);

      })
      .catch((err) => {
        console.error("Failed to fetch tracks:", err);

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


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-700 shadow-2xl">
        {/* Ambient glow pulled from the artwork, sitting behind everything */}
        <div
          className="absolute inset-0 scale-125 opacity-40 blur-3xl"
          style={{
            backgroundImage: `url(${coverSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* The styles on this div control the background of the song pop up */}
        <div className="absolute inset-0 bg-linear-to-b from-gray-100/1 to-gray-900/20" />

        {/* Content */}
        <div className="relative flex flex-col items-center px-8 pt-14 pb-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-red-600 px-4 py-1 rounded-md hover:bg-red-700 transition-colors z-10"
            
          >
            Close
          </button>

          <img
            src={coverSrc}
            alt={album.title}
            className="w-56 h-56 aspect-square object-cover rounded-lg shadow-2xl border-2 border-gray-600 mb-6"
          />

          <h2 className="text-2xl font-bold text-white text-center leading-tight">
            {track.title}
          </h2>
          <p className="text-base text-gray-300 mt-2 text-center">
            {artistName || "Loading artist…"}
          </p>
          <p className="text-sm text-gray-500 mt-1 text-center">
            {album.title}
          </p>
          {/* make sure that track_id is not null so we can actually play the audio through the player */}
          {songs.map((song) => (
            song.track_id && (
              <PlayButton
                trackId={song.track_id}
              />
            )
          ))}

        </div>
      </div>
    </div>
  );
}