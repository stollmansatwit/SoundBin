import { useEffect, useState } from "react";
import CreatePlaylistModal from "./CreatePlaylistModal";
import type { Playlist, Track } from "../../types";
import { API_BASE_URL } from '../../config';

const DEFAULT_IMAGE = "/defaultAlbum.png";

interface Props {
  /** Track ids to add (a single song, or every track in an album). */
  trackIds: number[];
  /** Used as the cover-art fallback if a brand new playlist is created here. */
  fallbackCoverTrack?: Track | null;
  onClose: () => void;
}

export default function AddToPlaylistPopup({ trackIds, fallbackCoverTrack, onClose }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const getCoverImage = (path?: string) => {
    if (!path) return DEFAULT_IMAGE;
    const file = path.split("/").pop();
    return `${API_BASE_URL}/assets/${file}`;
  };

  // Depend on the *contents* of trackIds, not the array reference — some
  // callers (e.g. the mini playback bar's options menu) rebuild trackIds
  // as a brand-new array literal on every render, and that render happens
  // continuously while a track plays. Depending on the array itself would
  // make this effect re-run (and flash back to "Loading...") many times a
  // second instead of just once when the tracks actually change.
  const trackIdsKey = trackIds.join(",");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const playlistsRes = await fetch(`${API_BASE_URL}/api/playlists`);
        const playlistsData: Playlist[] = playlistsRes.ok ? await playlistsRes.json() : [];
        setPlaylists(playlistsData);

        // A playlist is "selected" (shown as containing this track/album)
        // only if it already contains every track we're about to add.
        const membershipLists = await Promise.all(
          trackIds.map((trackId) =>
            fetch(`${API_BASE_URL}/api/track-playlists?trackID=${trackId}`)
              .then((res) => (res.ok ? res.json() : []))
              .catch(() => [] as number[])
          )
        );

        if (membershipLists.length === 0) {
          setSelectedPlaylistIds(new Set());
        } else {
          const [first, ...rest] = membershipLists;
          const intersection = (first as number[]).filter((id) =>
            rest.every((list: number[]) => list.includes(id))
          );
          setSelectedPlaylistIds(new Set(intersection));
        }
      } catch (error) {
        console.error("[AddToPlaylistPopup] Failed to load playlists:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trackIdsKey]);

  const handleTogglePlaylist = async (playlist: Playlist) => {
    if (pendingId !== null) return;
    setPendingId(playlist.playlist_id);

    const isSelected = selectedPlaylistIds.has(playlist.playlist_id);

    try {
      if (isSelected) {
        await Promise.all(
          trackIds.map((track_id) =>
            fetch(`${API_BASE_URL}/api/playlist-items`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ playlist_id: playlist.playlist_id, track_id }),
            })
          )
        );
        setSelectedPlaylistIds((prev) => {
          const next = new Set(prev);
          next.delete(playlist.playlist_id);
          return next;
        });
      } else {
        await Promise.all(
          trackIds.map((track_id) =>
            fetch(`${API_BASE_URL}/api/playlist-items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ playlist_id: playlist.playlist_id, track_id }),
            })
          )
        );
        setSelectedPlaylistIds((prev) => new Set(prev).add(playlist.playlist_id));
      }
    } catch (error) {
      console.error("[AddToPlaylistPopup] Failed to update playlist membership:", error);
    } finally {
      setPendingId(null);
    }
  };

  const handleCreated = async (playlist: Playlist) => {
    setShowCreate(false);
    setPlaylists((prev) => [playlist, ...prev]);
    setPendingId(playlist.playlist_id);
    try {
      await Promise.all(
        trackIds.map((track_id) =>
          fetch(`${API_BASE_URL}/api/playlist-items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playlist_id: playlist.playlist_id, track_id }),
          })
        )
      );
      setSelectedPlaylistIds((prev) => new Set(prev).add(playlist.playlist_id));
    } catch (error) {
      console.error("[AddToPlaylistPopup] Failed to add tracks to new playlist:", error);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center overflow-y-auto z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xs shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Add to Playlist</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-blue-400 hover:bg-white/5 transition-colors border-b border-gray-800"
        >
          <span className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-lg leading-none">+</span>
          <span className="text-sm font-semibold">New Playlist</span>
        </button>

        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          {loading ? (
            <p className="text-gray-500 text-sm italic px-4 py-3">Loading playlists...</p>
          ) : playlists.length === 0 ? (
            <p className="text-gray-500 text-sm italic px-4 py-3">No playlists yet.</p>
          ) : (
            playlists.map((playlist) => {
              const isSelected = selectedPlaylistIds.has(playlist.playlist_id);
              return (
                <button
                  key={playlist.playlist_id}
                  onClick={() => handleTogglePlaylist(playlist)}
                  disabled={pendingId === playlist.playlist_id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <img
                    src={getCoverImage(playlist.cover_art_url)}
                    alt=""
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                  <span className="text-sm text-white truncate flex-1">{playlist.name}</span>
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
                </button>
              );
            })
          )}
        </div>
      </div>

      {showCreate && (
        <CreatePlaylistModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          fallbackCoverTrack={fallbackCoverTrack}
        />
      )}
    </div>
  );
}
