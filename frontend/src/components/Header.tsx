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
      <div className='relative flex flex-col items-center gap-2 bg-transparent shadow-lg p-4 sm:grid sm:grid-cols-3 sm:items-center sm:gap-4'>
        {/* Empty spacer column so the title lands in the true center of the
            header on desktop, regardless of how wide the actions on the
            right end up being. */}
        <div className='hidden sm:block' aria-hidden="true" />

        <Link to="/home" className='flex justify-center'>
          <h1 className='text-white text-xl font-bold sm:text-2xl'>SoundBin</h1>
        </Link>

        <div className='flex items-center justify-center gap-3 sm:justify-self-end'>
          <button
            onClick={() => setShowCreatePlaylist(true)}
            className='flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-1.5 transition-colors'
            title='New Playlist'
          >
            <span className='text-lg leading-none'>+</span>
            <span className='hidden sm:inline'>New Playlist</span>
          </button>
          <HealthCheck />
        </div>
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
