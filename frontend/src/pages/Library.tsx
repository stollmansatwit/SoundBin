import { useEffect, useState } from 'react'
import { NavBar } from '../components/NavBar'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { RecentListenTable } from '../components/scrollable/RecentListenTable'
import { SongsTable } from '../components/library/SongsTable'
import { LibraryTabs, type LibrarySection } from '../components/library/LibraryTabs'
import { AlbumGrid } from '../components/library/AlbumGrid'
import { ArtistGrid } from '../components/library/ArtistGrid'
import { PlaylistGrid } from '../components/library/PlaylistGrid'

type Album = {
  album_id: string;
  artist_id: string;
  title: string;
  release_date?: any;
  cover_art_url?: string;
};

export default function Library() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<LibrarySection>('albums')
  const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  
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
  
  
    const displayAlbum = Array.isArray(albums) ? albums : [];

  const openNav = () => setIsNavOpen(true)
  const closeNav = () => setIsNavOpen(false)

  return (
    <div className={`min-h-screen bg-linear-to-t from-orange-400 to-gray-500 font-bold transition-[padding-left] duration-300 ${isNavOpen ? 'pl-32' : 'pl-16'}`}>
      <Header />
      <SearchBar />
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />

      <main className="px-8 pb-16 pt-4">
        <RecentListenTable />

        <div className="mt-10">
          <LibraryTabs active={activeSection} onChange={setActiveSection} />

          <div className="rounded-b-2xl rounded-tr-2xl bg-white/20 backdrop-blur-sm p-6 shadow-xl min-h-[420px]">
            {activeSection === 'albums' && <AlbumGrid />}
            {activeSection === 'songs' && <SongsTable />}
            {activeSection === 'artists' && <ArtistGrid album={albums[0]} onClose={() => {}} />}
            {activeSection === 'playlists' && <PlaylistGrid />}
          </div>
        </div>
      </main>
    </div>
  )
}