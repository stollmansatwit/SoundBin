export type LibrarySection = 'albums' | 'songs' | 'artists' | 'playlists'

interface Tab {
  id: LibrarySection
  label: string
}

const TABS: Tab[] = [
  { id: 'albums', label: 'Albums' },
  { id: 'songs', label: 'Songs' },
  { id: 'artists', label: 'Artists' },
  { id: 'playlists', label: 'Playlists' },
]

interface LibraryTabsProps {
  active: LibrarySection
  onChange: (section: LibrarySection) => void
}

export function LibraryTabs({ active, onChange }: LibraryTabsProps) {
  return (
    <div className="flex items-end gap-1" role="tablist" aria-label="Library sections">
      {TABS.map((tab) => {
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative px-5 py-2.5 text-sm tracking-wide uppercase rounded-t-lg transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-700 focus-visible:outline-offset-2 ${
              isActive
                ? 'bg-white/90 text-gray-900 -translate-y-0.5 shadow-[0_-2px_8px_rgba(0,0,0,0.15)]'
                : 'bg-white/40 text-white hover:bg-white/60 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}