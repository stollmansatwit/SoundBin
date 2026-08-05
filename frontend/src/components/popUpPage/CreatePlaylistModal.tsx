import type React from "react";
import { useEffect, useState } from "react";
import type { Playlist, Track } from "../../types";
import { API_BASE_URL } from '../../config';

const DEFAULT_IMAGE = "/defaultAlbum.png";

interface Props {
  onClose: () => void;
  onCreated: (playlist: Playlist) => void;
  /**
   * If the user doesn't provide a cover image, fall back to this track's
   * artwork (e.g. the first song being added to a brand-new playlist).
   * If neither is available, DEFAULT_IMAGE is used.
   */
  fallbackCoverTrack?: Track | null;
}

export default function CreatePlaylistModal({ onClose, onCreated, fallbackCoverTrack }: Props) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const fallbackPreview = fallbackCoverTrack?.cover_art_url
    ? `${API_BASE_URL}/assets/${fallbackCoverTrack.cover_art_url.split('/').pop()}`
    : DEFAULT_IMAGE;

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      let cover_art_url: string | null = null;

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
      } else if (fallbackCoverTrack?.cover_art_url) {
        // No image provided: use the first song's artwork if we have one.
        cover_art_url = fallbackCoverTrack.cover_art_url;
      }
      // else: leave null, popups already fall back to DEFAULT_IMAGE when rendering.

      const res = await fetch(`${API_BASE_URL}/api/playlists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), cover_art_url }),
      });

      if (!res.ok) throw new Error("Failed to create playlist");
      const playlist: Playlist = await res.json();
      onCreated(playlist);
    } catch (err) {
      console.error("[CreatePlaylistModal] Failed to create playlist:", err);
      setError("Failed to create playlist. Please try again.");
    } finally {
      setSubmitting(false);
      window.location.reload(); 
    }
  };
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center overflow-y-auto z-[60] p-4 animate-transparency"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full relative shadow-2xl p-6 animate-modal-open"
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

        <h2 className="text-xl font-bold text-white mb-4">New Playlist</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex justify-center">
            <label className="cursor-pointer group relative">
              <img
                src={imagePreview ?? fallbackPreview}
                alt="Playlist cover preview"
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-700 group-hover:opacity-70 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-lg">
                Choose image
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
              placeholder="My Playlist"
              autoFocus
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
