import { useMemo, useState } from "react";

export interface CircleSelectItem {
  id: number;
  label: string;
}

interface Props {
  label: string;
  items: CircleSelectItem[];
  selectedIds: number[];
  /** 'multi' toggles freely; 'single' selecting one clears any other. */
  mode?: "single" | "multi";
  placeholder?: string;
  /** Creates a brand new item (e.g. POSTs a new genre/artist) and resolves to it. */
  onCreate: (name: string) => Promise<CircleSelectItem>;
  onChange: (nextSelectedIds: number[]) => void;
}

/**
 * A searchable, scrollable list of clickable-circle checkboxes — the same
 * selection affordance used for adding songs to a playlist. Typing in the
 * search box filters the list; if nothing matches, a "Create new" row
 * appears so a brand-new genre/artist can be added on the fly.
 */
export default function CircleSelectList({
  label,
  items,
  selectedIds,
  mode = "multi",
  placeholder = "Search...",
  onCreate,
  onChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  const exactMatch = useMemo(
    () => items.some((item) => item.label.toLowerCase() === query.trim().toLowerCase()),
    [items, query]
  );

  const toggle = (id: number) => {
    if (mode === "single") {
      onChange(selectedIds.includes(id) ? [] : [id]);
      return;
    }
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (!name || creating) return;
    setCreating(true);
    setError(null);
    try {
      const created = await onCreate(name);
      setQuery("");
      if (mode === "single") {
        onChange([created.id]);
      } else {
        onChange([...selectedIds, created.id]);
      }
    } catch (err) {
      console.error(`[CircleSelectList] Failed to create ${label}:`, err);
      setError(`Failed to create. Please try again.`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="max-h-40 overflow-y-auto custom-scrollbar rounded-md border border-gray-800 bg-gray-800/40">
        {filtered.length === 0 && !query.trim() ? (
          <p className="text-gray-500 text-sm italic px-3 py-2">Nothing yet.</p>
        ) : (
          filtered.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => toggle(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "bg-blue-500 border-blue-500" : "border-gray-600"
                  }`}
                >
                  {isSelected && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-white truncate flex-1">{item.label}</span>
              </button>
            );
          })
        )}

        {query.trim() && !exactMatch && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="w-full flex items-center gap-3 px-3 py-2 text-left text-blue-400 hover:bg-white/5 transition-colors border-t border-gray-800 disabled:opacity-50"
          >
            <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-sm leading-none flex-shrink-0">+</span>
            <span className="text-sm font-semibold truncate">
              {creating ? "Creating..." : `Create "${query.trim()}"`}
            </span>
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
