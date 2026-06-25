import { useState } from 'react'
import { ScrollableAlbums } from '../components/scrollable/ScrollableAlbums'
import {NavBar} from '../components/NavBar'
import {RecentListenTable} from '../components/scrollable/RecentListenTable'
import { ScrollablePlaylists } from '../components/scrollable/ScrollablePlaylists'

export default function App() {
  const [isNavOpen, setIsNavOpen] = useState(false)

  const openNav = () => {
    setIsNavOpen(true)
  }

  const closeNav = () => {
    setIsNavOpen(false)
  }

  return (

    <div className={`min-h-screen bg-linear-to-t from-orange-500 to-gray-500 font-bold transition-[padding-left] duration-300 ${isNavOpen ? 'pl-32' : 'pl-16'}`}>
      <h1 className='flex justify-center bg-transparent shadow-lg p-4 text-orange-500'>SoundBin</h1>
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />
      <ScrollablePlaylists />
      <ScrollableAlbums />
      <RecentListenTable />

    </div>

  )
}


