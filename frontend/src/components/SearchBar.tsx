import { useEffect, useState } from "react";
import SongPopUp from "./popUpPage/SongPopUp";
import AlbumPopUp from "./popUpPage/AlbumPopUp";
import { type Album, type Track, type Artist, type Playlist } from "../types";
import ArtistPopUp from "./popUpPage/ArtistPopUp";
import PlaylistPopUp from "./popUpPage/PlaylistPopUp";
import { API_BASE_URL } from "../config";

type SearchResult = {
  type: string;
  id: string;
  name: string;
};

export function SearchBar() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);




  const handleSearch = async (e: React.ChangeEvent<HTMLFormElement>) => {
    
    setSearched(true)
    // Reload key is so search bar re-renders when going to a different page like from home to library for example
    setReloadKey(prev => prev + 1)
    e.preventDefault();




    try {
      const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(name)}`);
      if (!res.ok) {
        console.error(`Request failed with status ${res.status}`);
        return;
      }

      const data = (await res.json()) as SearchResult[];
      setResults(data);
      // if data is an empty array, it means the search query has no results
      if (data.length === 0) {
        console.log("no results")}


    } catch (error) {
      console.error("Failed to fetch search results:", error);
    }
    finally {
      // setName("")
      
    }
    
  };

  useEffect(() => {

    fetch(`${API_BASE_URL}/api/album-path`)
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

      });

    
    fetch(`${API_BASE_URL}/api/tracks`)
      .then((response) => {
        if (!response.ok) {
          console.log(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Track[]) => {
        setTracks(data);
      })
      .catch((error) => {
        console.error("Failed to fetch tracks:", error);
      })
      .finally(() => {

      });

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
        console.error("Failed to fetch artists:", error);
      })
      .finally(() => {

      });

    fetch(`${API_BASE_URL}/api/playlists`)
      .then((response) => {
        if (!response.ok) {
          console.log(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Playlist[]) => {
        setPlaylists(data);
      })
      .catch((error) => {
        console.error("Failed to fetch playlists:", error);
      })
      .finally(() => {

      });
  }, []);

  const handleClick = (r: SearchResult) => {
    // if our search result is an album, find the full album object from the albums state and set it to selectedAlbum, which will trigger the AlbumPopUp to open
    if (r.type === 'album') {
      const fullAlbum = albums.find((a) => a.album_id === Number(r.id));
      if (fullAlbum) {
        setSelectedAlbum(fullAlbum);
      } else {
        console.warn(`Album with id ${r.id} not found in loaded albums`, r);
      }
      return;
    }
    else if (r.type === 'song') {
      // r.id is the TRACK's id here, not an album id — resolve the real
      // track first, then use ITS album_id to find the matching album.
      const fullTrack = tracks.find((t) => t.track_id === Number(r.id));

      if (!fullTrack) {
        console.warn(`Track with id ${r.id} not found in loaded tracks`, r);
        return;
      }

      const fullAlbum = albums.find((a) => a.album_id === fullTrack.album_id);

      if (!fullAlbum) {
        console.warn(`Album with id ${fullTrack.album_id} not found for track`, fullTrack);
        return;
      }
      
      setSelectedTrack(fullTrack);
      setSelectedAlbum(fullAlbum);
      return;
    }
    else if (r.type === 'artist'){
      const fullArtist = artists.find((t) => t.artist_id === Number(r.id));
      if (!fullArtist) {
        console.warn(`Artist with id ${r.id} not found in loaded artists`, r);
        return;
      }
      setSelectedArtist(fullArtist)
      return
    }
    else if (r.type === 'playlist'){
      const fullPlaylist = playlists.find((t) => t.playlist_id === Number(r.id));
      if (!fullPlaylist) {
        console.warn(`Playlist with id ${r.id} not found in loaded playlists`, r);
        return;
      }
      setSelectedPlaylist(fullPlaylist)
      return
    }
    else {
      console.warn(`Unknown search result type: ${r.type}`, r);
    }
    //console.log("Clicked on search result:", r);
  };

  const handleHighlight = (text: string, query: string) => {
    // This function highlights the search query in the result text by wrapping it in <mark> tags. It uses a regular expression to find all occurrences of the query, ignoring case.
    const regex = new RegExp(`(${query})`, 'gi');
    // Note the use of class here instead of className, because this is rendered as HTML and not as JSX
    return text.replace(regex, '<mark class = "bg-white/40 ">$1</mark>');
  };

  const closePopUp = () => {
    setSelectedAlbum(null);
    setSelectedTrack(null);
    setSelectedArtist(null);
    setSelectedPlaylist(null);
  }


  return (
    <div key={reloadKey}>
      <form className="flex items-center justify-center gap-2 p-4" onSubmit={handleSearch}>
        <input
          id="search-bar"
          type="text"
          className="w-full max-w-xs sm:max-w-sm md:max-w-md p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Search songs, artists, albums..."
        />
        <input type="submit" value="🔎" className="shrink-0 bg-orange-500 border border-gray-300 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xl" />
      </form>


      {results.length > 0 &&
        (
          <ul className="bg-white/10 max-h-60 overflow-auto p-2 m-4 sm:mx-auto sm:max-w-md rounded">
            {results.map((r) => (
              <li key={`${r.type}-${r.id}`} className="p-2 cursor-pointer hover:bg-white/20" onClick={() => handleClick(r)}>
                <strong className="pr-2">{r.type}</strong>
                {/* output a highlight on just the searched text */}
                
                <span className="pl-2" dangerouslySetInnerHTML={{ __html: handleHighlight(r.name, name) }} />
                
              </li>
            ))}
          </ul>
        )}

      {selectedTrack && selectedAlbum && (
        <SongPopUp
          track={selectedTrack}
          onClose={() => {
            closePopUp();
          }
          }
          album_id={selectedAlbum.album_id} />

      )}
      {selectedAlbum && !selectedTrack && (
        <AlbumPopUp
          album={selectedAlbum}
          onClose={closePopUp} />
      )}

      {selectedArtist && !selectedTrack &&(
        <ArtistPopUp
        artist = {selectedArtist}
        onClose = {closePopUp}/>

      )}

      {selectedPlaylist && !selectedTrack &&(
        <PlaylistPopUp
        playlist = {selectedPlaylist}
        onClose = {closePopUp}/>

      )}


      {results.length == 0 && searched && (
        <ul className="bg-white/10 max-h-60 overflow-auto p-2 m-4 sm:mx-auto sm:max-w-md rounded">
          <li className="p-2 cursor-pointer hover:bg-white/20">
            No results found
          </li>
        </ul>)}
    </div>
  );
}