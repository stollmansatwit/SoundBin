interface Artist {
  id: string
  name: string
  albumCount: number
  initials: string
  avatarColor: string
}

const MOCK_ARTISTS: Artist[] = [
  { id: '1', name: 'Marlow Reed', albumCount: 4, initials: 'MR', avatarColor: 'from-orange-400 to-rose-500' },
  { id: '2', name: 'The Quiet Hours', albumCount: 2, initials: 'QH', avatarColor: 'from-amber-400 to-orange-600' },
  { id: '3', name: 'Coastal Drift', albumCount: 3, initials: 'CD', avatarColor: 'from-slate-500 to-gray-700' },
  { id: '4', name: 'June Arcade', albumCount: 1, initials: 'JA', avatarColor: 'from-yellow-400 to-amber-600' },
]

export function ArtistGrid() {
  // TODO: replace MOCK_ARTISTS with data fetched from the library API
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {MOCK_ARTISTS.map((artist) => (
        <button
          key={artist.id}
          className="group flex flex-col items-center text-center rounded-lg p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 focus-visible:outline-offset-2"
        >
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br ${artist.avatarColor} text-white shadow-md transition-transform duration-200 group-hover:scale-105`}
          >
            {artist.initials}
          </div>
          <p className="mt-2 truncate text-sm font-bold text-gray-900">{artist.name}</p>
          <p className="text-xs font-normal text-gray-500">{artist.albumCount} albums</p>
        </button>
      ))}
    </div>
  )
}