import {useState} from "react";

export function SearchBar() {
  const [name, setName] = useState("");
  const handleSearch = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Searching for: ${name}`);
  };

  return (
    <form className="flex items-center justify-center p-4" onSubmit={handleSearch}>
      <input
        id = "search-bar"
        type = "text"
        className="w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xl"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input type="submit" value="🔎" className="ml-2 bg-orange-500 border border-gray-300 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xl" />
    </form>
  )
}

