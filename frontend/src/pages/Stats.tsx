import { useState } from 'react'
import {NavBar} from '../components/NavBar'

export default function Stats() {
  const [isNavOpen, setIsNavOpen] = useState(false)

  const openNav = () => {
    setIsNavOpen(true)
  }

  const closeNav = () => {
    setIsNavOpen(false)
  }

  return (
    <div className={`min-h-screen bg-linear-to-t from-orange-500 to-gray-500 font-bold transition-[padding-left] duration-300 ${isNavOpen ? 'pl-32' : 'pl-16'}`}>
      <h1 className='flex justify-center bg-gray-800 p-4 text-white'>Welcome to 🎵 SoundBin.</h1>
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />
      <div className="p-4">
        <h2 className="text-2xl font-bold text-white">Stats</h2>
        <p className="text-gray-300">This is the stats page.</p>
      </div>
    </div>
  )
}
