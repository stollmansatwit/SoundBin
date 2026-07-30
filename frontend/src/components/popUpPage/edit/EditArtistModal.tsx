import type React from "react";
import { useState } from "react";
import type { Artist } from "../../../types";
import { API_BASE_URL } from '../../../config';

const DEFAULT_IMAGE = "/defaultAlbum.png";

interface Props {
  artist: Artist;
  onClose: () => void;
  onSaved: (artist: Artist) => void;
}

export default function EditArtistModal({ artist, onClose, onSaved }: Props) {
  const [name, setName] = useState(artist.name);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentImage = artist.image_url
    ? `${API_BASE_URL}/assets/${artist.image_url.split('/').pop()}`
    : DEFAULT_IMAGE;

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
      let image_url: string | undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload-image`, {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          image_url = uploadData.cover_art_url;
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/artists/${artist.artist_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ...(image_url ? { image_url } : {}) }),
      });
      if (!res.ok) throw new Error("Failed to update artist");
      const updated: Artist = await res.json();
      onSaved(updated);
      onClose();
    } catch (err) {
      console.error("[EditArtistModal] Failed to save:", err);
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

        <h2 className="text-xl font-bold text-white mb-4">Edit Artist</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex justify-center">
            <label className="cursor-pointer group relative">
              <img
                src={imagePreview ?? currentImage}
                alt="Artist image preview"
                className="w-32 h-32 object-cover rounded-full border-2 border-gray-700 group-hover:opacity-70 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                Change image
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Artist name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
