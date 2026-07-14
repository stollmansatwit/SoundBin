interface Song {
  id: string
  title: string
  artist: string
  album: string
  duration: string
}

const MOCK_SONGS: Song[] = [
  { id: '1', title: 'Amber Static', artist: 'Marlow Reed', album: 'Nightcolors', duration: '3:24' },
  { id: '2', title: 'Slow Fade', artist: 'The Quiet Hours', album: 'Static Bloom', duration: '4:02' },
  { id: '3', title: 'Undertow', artist: 'Coastal Drift', album: 'Low Tide', duration: '2:57' },
  { id: '4', title: 'Cardboard Sky', artist: 'June Arcade', album: 'Paper Planets', duration: '3:41' },
  { id: '5', title: 'Copper Line', artist: 'Marlow Reed', album: 'Rust & Gold', duration: '3:15' },
]

export function SongsTable() {
  // TODO: replace MOCK_SONGS with data fetched from the library API
  return (
    <div className="max-h-[420px] overflow-y-auto rounded-lg">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white/95 text-xs font-bold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Artist</th>
            <th className="px-3 py-2">Album</th>
            <th className="px-3 py-2 text-right">Duration</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_SONGS.map((song) => (
            <tr key={song.id} className="border-t border-gray-200 hover:bg-orange-50">
              <td className="px-3 py-2.5 font-bold text-gray-900">{song.title}</td>
              <td className="px-3 py-2.5 font-normal text-gray-600">{song.artist}</td>
              <td className="px-3 py-2.5 font-normal text-gray-600">{song.album}</td>
              <td className="px-3 py-2.5 text-right font-normal text-gray-500">{song.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}