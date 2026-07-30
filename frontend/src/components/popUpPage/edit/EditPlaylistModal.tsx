import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Playlist, Track } from "../../../types";
import { API_BASE_URL } from '../../../config';
import TrackSequenceEditor from "./TrackSequenceEditor";

interface Props {
  playlist: Playlist;
  onClose: () => void;
  onSaved: (playlist: Playlist) => void;
}

/**
 * Measures the live rendered height of the element the returned ref is
 * attached to (via ResizeObserver, so it stays accurate as content
 * changes). Used so the track sequence editor can be capped to exactly
 * match the height of the options column beside it — but only once
 * they're actually arranged side-by-side (md breakpoint and up); below
 * that they stack vertically, so no cap is applied.
 */
function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const isSideBySide = window.matchMedia("(min-width: 768px)").matches;
      setHeight(isSideBySide ? el.offsetHeight : undefined);
    };

    update();

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    window.addEventListener("resize", update);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return { ref, height };
}

export default function EditPlaylistModal({ playlist, onClose, onSaved }: Props) {
  const [name, setName] = useState(playlist.name);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { ref: leftColRef, height: leftColHeight } = useMeasuredHeight<HTMLDivElement>();

  const currentCover = playlist.cover_art_url
    ? `${API_BASE_URL}/assets/${playlist.cover_art_url.split('/').pop()}`
    : "/defaultAlbum.png";

  useEffect(() => {
    let cancelled = false;
    setLoadingTracks(true);
    fetch(`${API_BASE_URL}/api/playlist-tracks?id=${playlist.playlist_id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Track[]) => { if (!cancelled) setTracks(data); })
      .catch((err) => console.error("[EditPlaylistModal] Failed to load tracks:", err))
      .finally(() => { if (!cancelled) setLoadingTracks(false); });
    return () => { cancelled = true; };
  }, [playlist.playlist_id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
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

      const res = await fetch(`${API_BASE_URL}/api/playlists/${playlist.playlist_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          trackOrder: tracks.map((t) => t.track_id),
          ...(cover_art_url ? { cover_art_url } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to update playlist");
      const updated: Playlist = await res.json();
      onSaved(updated);
      onClose();
    } catch (err) {
      console.error("[EditPlaylistModal] Failed to save:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center overflow-y-auto z-[60] p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full relative shadow-2xl p-6"
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

        <h2 className="text-xl font-bold text-white mb-4">Edit Playlist</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Left column: cover art + name — its rendered height sets the ceiling for the track list on the right */}
            <div ref={leftColRef} className="flex flex-col gap-4 w-full md:w-1/2">
              <div className="flex justify-center">
                <label className="cursor-pointer group relative">
                  <img
                    src={imagePreview ?? currentCover}
                    alt="Playlist cover preview"
                    className="w-28 h-28 object-cover rounded-lg border-2 border-gray-700 group-hover:opacity-70 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                    Change image
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Playlist name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right column: track sequence — capped to the left column's rendered height (never taller), scrolls internally past that */}
            <div
              className="flex flex-col w-full md:w-1/2"
              style={leftColHeight ? { height: leftColHeight } : undefined}
            >
              <label className="block text-sm text-gray-400 mb-1 flex-shrink-0">Track order</label>
              {loadingTracks ? (
                <p className="text-gray-500 text-sm italic py-2">Loading tracks...</p>
              ) : (
                <TrackSequenceEditor
                  tracks={tracks}
                  onChange={setTracks}
                  className={leftColHeight ? "flex-1 min-h-0" : "max-h-80"}
                />
              )}
            </div>
          </div>

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
              disabled={!name.trim() || submitting}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
