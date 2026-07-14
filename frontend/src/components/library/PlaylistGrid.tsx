interface Playlist {
  id: string
  name: string
  trackCount: number
  coverColor: string
}

const MOCK_PLAYLISTS: Playlist[] = [
  { id: '1', name: 'Late Night Drive', trackCount: 24, coverColor: 'from-orange-500 to-gray-600' },
  { id: '2', name: 'Sunday Reset', trackCount: 18, coverColor: 'from-amber-400 to-orange-500' },
  { id: '3', name: 'Focus Loop', trackCount: 31, coverColor: 'from-slate-600 to-gray-800' },
  { id: '4', name: 'Rewind 2019', trackCount: 42, coverColor: 'from-rose-400 to-orange-500' },
]

export function PlaylistGrid() {
  // TODO: replace MOCK_PLAYLISTS with data fetched from the library API
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MOCK_PLAYLISTS.map((playlist) => (
        <button
          key={playlist.id}
          className={`group flex items-center gap-4 rounded-lg bg-linear-to-r ${playlist.coverColor} p-4 text-left shadow-md transition-transform duration-200 hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-700 focus-visible:outline-offset-2`}
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-white/20 text-2xl">
            ♪
          </div>
          <div>
            <p className="text-sm font-bold text-white">{playlist.name}</p>
            <p className="text-xs font-normal text-white/80">{playlist.trackCount} tracks</p>
          </div>
        </button>
      ))}
    </div>
  )
}