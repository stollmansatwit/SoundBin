interface Album {
  id: string
  title: string
  artist: string
  year: number
  coverColor: string
}

const MOCK_ALBUMS: Album[] = [
  { id: '1', title: 'Nightcolors', artist: 'Marlow Reed', year: 2023, coverColor: 'from-orange-400 to-rose-500' },
  { id: '2', title: 'Static Bloom', artist: 'The Quiet Hours', year: 2021, coverColor: 'from-amber-400 to-orange-600' },
  { id: '3', title: 'Low Tide', artist: 'Coastal Drift', year: 2024, coverColor: 'from-slate-500 to-gray-700' },
  { id: '4', title: 'Paper Planets', artist: 'June Arcade', year: 2020, coverColor: 'from-yellow-400 to-amber-600' },
  { id: '5', title: 'Rust & Gold', artist: 'Marlow Reed', year: 2019, coverColor: 'from-orange-500 to-red-600' },
  { id: '6', title: 'Halfway House', artist: 'Coastal Drift', year: 2022, coverColor: 'from-gray-500 to-slate-700' },
]

export function AlbumGrid() {
  // TODO: replace MOCK_ALBUMS with data fetched from the library API
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {MOCK_ALBUMS.map((album) => (
        <button
          key={album.id}
          className="group text-left rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 focus-visible:outline-offset-2"
        >
          <div
            className={`aspect-square w-full rounded-lg bg-linear-to-br ${album.coverColor} shadow-md transition-transform duration-200 group-hover:scale-[1.03] group-hover:shadow-lg`}
          />
          <p className="mt-2 truncate text-sm font-bold text-gray-900">{album.title}</p>
          <p className="truncate text-xs font-normal text-gray-500">{album.artist} · {album.year}</p>
        </button>
      ))}
    </div>
  )
}