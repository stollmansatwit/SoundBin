import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HealthCheck } from './HealthCheck'
import CreatePlaylistModal from './popUpPage/CreatePlaylistModal'
import { usePopups } from '../context/PopupContext'
import type { Playlist } from '../types'

export function Header() {
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const { openPlaylist } = usePopups()

  const handleCreated = (playlist: Playlist) => {
    setShowCreatePlaylist(false)
    openPlaylist(playlist)
  }

  return (
    <>
      <Link to="/home">
        <h1 className='flex justify-center bg-transparent shadow-lg p-4 text-white'>SoundBin</h1>
      </Link>

      <div className='absolute right-5 top-4 flex items-center gap-3'>
        <button
          onClick={() => setShowCreatePlaylist(true)}
          className='flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-1.5 transition-colors'
        >
          <span className='text-lg leading-none'>+</span> New Playlist
        </button>
        <HealthCheck />
      </div>

      {showCreatePlaylist && (
        <CreatePlaylistModal
          onClose={() => setShowCreatePlaylist(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  )
}
