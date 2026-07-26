import { useEffect, useState, useRef } from "react";
import { ScrollableArtistAlbums } from '../scrollable/artist/ScrollableArtistAlbums'
//import { ScrollableArtistTracks} from '../scrollable/artist/ScrollableArtistAlbums'
import type { Artist, Album, Track, Playlist, PlaylistItem } from "../../types";

interface Props {
  artist: Artist;
  onClose: () => void;
}


const DEFAULT_IMAGE = "/defaultAlbum.png"; 

// Placeholder types for the future components to avoid errors in this file
// These components will be imported later
declare const ScrollableArtistTracks: React.FC<{ artistId: number }>;
declare const ScrollableArtistPlaylists: React.FC<{ artistId: number }>;

export default function ArtistPopUp({ artist, onClose }: Props) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState({
    albums: 0,
    tracks: 0,
    playlistAppearances: 0,
  });
  
  const [loading, setLoading] = useState(true);

  // Handle closing when clicking outside the modal content
  const overlayRef = useRef<HTMLDivElement>(null);


  const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

  useEffect(() => {
    if (!artist?.artist_id) return;

    // Simulate fetching stats for now. 
    // In a real app, you would fetch these counts from your API endpoints.
    // For example: fetch(`/api/artist-stats?id=${artist.artist_id}`)
    // For demonstration, we'll use dummy data or fetch specific lists to count them if needed.
    
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch albums count
        const albumsRes = await fetch(`${apiBaseUrl}/api/artist-albums?artistID=${artist.artist_id}`);
        if (albumsRes.ok) {
          const albumsJSON: Album[] = await albumsRes.json();
          console.log("ARITST ALBUMS", JSON.stringify(albumsJSON));
          setAlbums(albumsJSON)
          setStats(prev => ({ ...prev, albums: albumsJSON.length }));
        }

        // Fetch tracks count (this might be a direct endpoint or derived from albums)
        const tracksRes = await fetch(`${apiBaseUrl}/api/artist-tracks?artistID=${artist.artist_id}`);
        if (tracksRes.ok) {
          const tracksJSON: Track[] = await tracksRes.json();
          setTracks(tracksJSON)
          setStats(prev => ({ ...prev, tracks: tracksJSON.length }));
        }

        // Fetch playlist appearances count
        // This is often a complex query. Assuming an endpoint exists for now.
       // const playlistsRes = await fetch(`http://localhost:3000/api/artist-playlist-appearances?artistID=${artist.artist_id}`);
        //if (playlistsRes.ok) {
         // const playlists: PlaylistItem[] = await playlistsRes.json();
          //setStats(prev => ({ ...prev, playlistAppearances: playlists.length }));
       // }
      } catch (error) {
        console.error("Failed to fetch artist stats:", error);
        // Fallback for demo purposes so the UI doesn't break if API is down
        setStats({ albums: 12, tracks: 150, playlistAppearances: 45 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Escape key to close
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [artist?.artist_id, onClose]);

  // Handle click on overlay to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (overlayRef.current && e.target === overlayRef.current) {
      onClose();
    }
  };

  const getImageUrl = (path?: string) => {
    if (!path || path == "" || path == null) {
      return DEFAULT_IMAGE;
    }

    const file = path.split('/').pop();
    return `${apiBaseUrl}/assets/${file}`;
  };

  const statsList = [
    { label: "Albums", value: stats.albums },
    { label: "Tracks", value: stats.tracks },
    { label: "In Playlists", value: stats.playlistAppearances },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-5xl w-full relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Section */}
        <div className="p-8 pb-6 flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left: Artist Image and Info */}
          <div className="flex-shrink-0 flex flex-col md:flex-row gap-6 w-full md:w-auto">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden shadow-lg border-2 border-gray-800">
              <img 
                src={getImageUrl(artist.image_url)} 
                alt={artist.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex flex-col justify-center gap-2">
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {artist.name}
              </h1>
              
              {/* Bio */}
              {artist.bio && (
                <p className="text-gray-400 max-w-xl line-clamp-3 md:line-clamp-none text-sm md:text-base mt-2">
                  {artist.bio}
                </p>
              )}
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex-shrink-0 flex gap-8 justify-end items-center min-w-[150px]">
            <div className="flex flex-col gap-4 text-right">
              {statsList.map((stat) => (
                <div key={stat.label} className="flex flex-col items-end md:items-start">
                  <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">{stat.label}</span>
                  <span className="text-white text-xl font-bold">
                    {loading ? "-" : stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 w-full" />

        {/* Main Section: Scrollable Content */}
        <div className="p-8 overflow-y-auto flex-grow custom-scrollbar">
          
          {/* Albums */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Albums</h2>
            < ScrollableArtistAlbums albums={albums} />
          </div>

          {/* Tracks */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Tracks</h2>
            {/* Replace with actual component later */}
            {/* <ScrollableArtistTracks artistId={artist.artist_id} /> */}
            <div className="bg-gray-800/50 p-4 rounded-lg text-gray-500 italic">
              Tracks section placeholder (component ScrollableArtistTracks will go here)
            </div>
          </div>

          {/* Playlists */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Featured In Playlists</h2>
            {/* Replace with actual component later */}
            {/* <ScrollableArtistPlaylists artistId={artist.artist_id} /> */}
            <div className="bg-gray-800/50 p-4 rounded-lg text-gray-500 italic">
              Playlists section placeholder (component ScrollableArtistPlaylists will go here)
            </div>
          </div>

          {/* Recently Listened to */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Recently Listened To</h2>
            <div className="bg-gray-800/50 p-4 rounded-lg text-gray-500 italic">
              Recently Listened section placeholder
            </div>
          </div>

          {/* Featured On */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Featured On</h2>
            <div className="bg-gray-800/50 p-4 rounded-lg text-gray-500 italic">
              Featured On section placeholder
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}