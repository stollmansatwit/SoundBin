import { useState } from 'react'
import { NavBar } from '../components/NavBar'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { RecentListenTable } from '../components/scrollable/RecentListenTable'
import { SongsTable } from '../components/scrollable/SongsTable'
import { LibraryTabs, type LibrarySection } from '../components/library/LibraryTabs'
import { AlbumGrid } from '../components/library/AlbumGrid'
import { ArtistGrid } from '../components/library/ArtistGrid'
import { PlaylistGrid } from '../components/library/PlaylistGrid'

export default function Library() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<LibrarySection>('albums')

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

          <div className="rounded-b-2xl rounded-tr-2xl bg-white/9 backdrop-blur-sm p-6 shadow-xl min-h-[420px]">
            {activeSection === 'albums' && <AlbumGrid />}
            {activeSection === 'songs' && <SongsTable />}
            {activeSection === 'artists' && <ArtistGrid />}
            {activeSection === 'playlists' && <PlaylistGrid />}
          </div>
        </div>
      </main>
    </div>
  )
}