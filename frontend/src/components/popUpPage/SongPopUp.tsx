import { useEffect, useState } from "react";
import { PlayButton } from "../buttons/PlayButton";
import {type Album, type Track} from "../../types";

interface Props {
  album_id: number;
  track: Track;
  onClose: () => void;
}

export default function SongPopUp({ track, album_id, onClose }: Props) {
  const [artistName, setArtistName] = useState<string>("");
  const [albumName, setAlbumName] = useState<string>("");
  const [artistId, setArtistID] = useState<number>(0);
  const [song, setSong] = useState<Track | null>(null);

  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;


  const getCoverImage = (path?: string) => {
    if (!path) return "/defaultAlbum.png";
    const file = path.split("/").pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  const coverSrc = getCoverImage(track.cover_art_url);

  useEffect(() => {

    fetch(`${apiBaseUrl}/api/tracks/${track.track_id}`)
      .then((res) => res.json())
      .then((data: Track) => {
        setSong(data || null);
      })
      .catch((err) => {
        console.error("Failed to fetch track:", err);
      });

      // Fetch artist name if artist_id exists
    if (track.track_id) {
      fetch(`${apiBaseUrl}/api/track-artist?trackID=${track.track_id}`)
        .then((res) => res.json())
        .then((data: any) => {
          setArtistName(data.contributors[0].artist.name || "Unknown Artist");
          setArtistID(data.contributors[0].artist.artist_id)
        })
        .catch(err => console.error("Failed to fetch artist:", err));

      fetch(`${apiBaseUrl}/api/album-title?albumID=${album_id}`)
        .then((res) => res.json())
        .then((data: Album) => {
          setAlbumName(data.title);
        })
        .catch((error) => {
          console.error('Failed to fetch track:', error)
        });
    }
  }, []);


  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-700 shadow-2xl">
        {/* Ambient glow pulled from the artwork, sitting behind everything */}
        <div
          className="absolute inset-0 scale-125 opacity-80 blur-3xl"
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
            alt={song ? song.title : "Unkown Track"}
            className="w-56 h-56 aspect-square object-cover rounded-lg shadow-2xl border-2 border-gray-600 mb-6"
          />

          <h2 className="text-2xl font-bold text-white text-center leading-tight">
            {track.title}
          </h2>
          <p className="text-base text-gray-300 mt-2 text-center">
            {artistName || "Loading artist…"}
          </p>
          <p className="text-sm text-gray-300 mt-1 text-center">
            {albumName ? albumName : ""}
          </p>
          {/* make sure that track_id is not null so we can actually play the audio through the player */}
          
          
            {song && (
              <PlayButton
                trackId={song.track_id}
                key={song.track_id}
                albumId={song.album_id}
                artistId={artistId}
                index={-1}
              />
          )}

        </div>
      </div>
    </div>
  );
}