import type React from "react";
import { useEffect, useState } from "react";
import type { Track, Genre } from "../../../types";
import { API_BASE_URL } from '../../../config';
import CircleSelectList from "./CircleSelectList";

const DEFAULT_IMAGE = "/defaultAlbum.png";

interface Props {
  track: Track;
  onClose: () => void;
  onSaved: () => void;
}

/** yyyy-mm-dd for a native <input type="date">, tolerant of Date/ISO/null. */
const toDateInputValue = (date: any): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export default function EditTrackModal({ track, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(track.title);
  const [releaseDate, setReleaseDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentCover, setCurrentCover] = useState<string | undefined>(track.cover_art_url);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [artists, setArtists] = useState<{ artist_id: number; name: string }[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [selectedArtistIds, setSelectedArtistIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [trackRes, genresRes, artistsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tracks/${track.track_id}`),
          fetch(`${API_BASE_URL}/api/genres`),
          fetch(`${API_BASE_URL}/api/artists`),
        ]);

        if (cancelled) return;

        if (trackRes.ok) {
          const full = await trackRes.json();
          setTitle(full.title ?? track.title);
          setReleaseDate(toDateInputValue(full.release_date));
          setCurrentCover(full.cover_art_url ?? undefined);
          setSelectedGenreIds((full.genres ?? []).map((g: any) => g.genre.genre_id));
          setSelectedArtistIds((full.contributors ?? []).map((c: any) => c.artist.artist_id));
        }
        if (genresRes.ok) setGenres(await genresRes.json());
        if (artistsRes.ok) setArtists(await artistsRes.json());
      } catch (err) {
        console.error("[EditTrackModal] Failed to load track details:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [track.track_id]);

  const coverPreview = imagePreview
    ?? (currentCover ? `${API_BASE_URL}/assets/${currentCover.split('/').pop()}` : DEFAULT_IMAGE);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleCreateGenre = async (name: string) => {
    const res = await fetch(`${API_BASE_URL}/api/genres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create genre");
    const genre: Genre = await res.json();
    setGenres((prev) => (prev.some((g) => g.genre_id === genre.genre_id) ? prev : [...prev, genre]));
    return { id: genre.genre_id, label: genre.name };
  };

  const handleCreateArtist = async (name: string) => {
    const res = await fetch(`${API_BASE_URL}/api/artists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create artist");
    const artist = await res.json();
    setArtists((prev) => (prev.some((a) => a.artist_id === artist.artist_id) ? prev : [...prev, artist]));
    return { id: artist.artist_id, label: artist.name };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      let cover_art_url: string | undefined;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload-image`, {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          cover_art_url = uploadData.cover_art_url;
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/tracks/${track.track_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          release_date: releaseDate || null,
          genreIds: selectedGenreIds,
          artistIds: selectedArtistIds,
          ...(cover_art_url ? { cover_art_url } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to update track");
      onSaved();
      onClose();
    } catch (err) {
      console.error("[EditTrackModal] Failed to save:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center overflow-y-auto z-[60] p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full relative shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-4">Edit Song</h2>

        {loading ? (
          <p className="text-gray-500 text-sm italic py-6 text-center">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto custom-scrollbar pr-1">
            <div className="flex justify-center">
              <label className="cursor-pointer group relative">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-28 h-28 object-cover rounded-lg border-2 border-gray-700 group-hover:opacity-70 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                  Change image
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Release date</label>
              <input
                type="date"
                value={releaseDate}
                max={toDateInputValue(new Date())}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
              />
            </div>

            <CircleSelectList
              label="Genres"
              mode="multi"
              placeholder="Search or create a genre..."
              items={genres.map((g) => ({ id: g.genre_id, label: g.name }))}
              selectedIds={selectedGenreIds}
              onChange={setSelectedGenreIds}
              onCreate={handleCreateGenre}
            />

            <CircleSelectList
              label="Artists"
              mode="multi"
              placeholder="Search or create an artist..."
              items={artists.map((a) => ({ id: a.artist_id, label: a.name }))}
              selectedIds={selectedArtistIds}
              onChange={setSelectedArtistIds}
              onCreate={handleCreateArtist}
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || submitting}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
