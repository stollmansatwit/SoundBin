import { useState } from "react";

type SearchResult = {
  type: string;
  id: number;
  name: string;
};

export function SearchBar() {
  const [name, setName] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [reloadKey, setReloadKey] = useState(0)


  const handleSearch = async (e: React.ChangeEvent<HTMLFormElement>) => {
    setSearched(true)
    // Reload key is so search bar re-renders when going to a different page like from home to library for example
    setReloadKey(prev=>prev+1)
    e.preventDefault();




    const apiBaseUrl = "http://localhost:3000";
    try {
      const res = await fetch(`${apiBaseUrl}/api/search?q=${encodeURIComponent(name)}`);
      if (!res.ok) {
        console.error(`Request failed with status ${res.status}`);
        return;
      }

      const data = (await res.json()) as SearchResult[];
      setResults(data);
      // if data is an empty array, it means the search query has no results
      if (data.length === 0) {
        console.log("no results")
      }
      
    } catch (error) {
      console.error("Failed to fetch search results:", error);
    }
    finally {
      setName("")
    }
  };

  return ( 
    <div key = {reloadKey}>
      <form className="flex items-center justify-center p-4" onSubmit={handleSearch}>
        <input
          id="search-bar"
          type="text"
          className="w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Search songs, artists, albums..."
        />
        <input type="submit" value="🔎" className="ml-2 bg-orange-500 border border-gray-300 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xl" />
      </form>

      {results.length > 0 && (
        <ul className="bg-white/10 max-h-60 overflow-auto p-2 m-4 rounded">
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`} className="p-2 cursor-pointer hover:bg-white/20" onClick={() => console.log('clicked', r)}>
              <strong className="pr-2">{r.type}</strong>
              {r.name}
            </li>
          ))}
        </ul>
      )}
      {results.length==0&&searched&&(
        <ul className="bg-white/10 max-h-60 overflow-auto p-2 m-4 rounded">
          <li className="p-2 cursor-pointer hover:bg-white/20">
            No results found
          </li>
        </ul>)}
    </div>
  );
}

