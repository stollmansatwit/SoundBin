import { useState } from "react";
import { OptionsMenu } from "./OptionsMenu";
import { useAudio } from "../../context/AudioContext";
import { usePopups } from "../../context/PopupContext";
import AddToPlaylistPopup from "../popUpPage/AddToPlaylistPopup";
import EditAlbumModal from "../popUpPage/edit/EditAlbumModal";
import ConfirmDialog from "../popUpPage/ConfirmDialog";
import type { Album, Track } from "../../types";
import { API_BASE_URL } from '../../config';


interface Props {
  album: Album;
  tracks: Track[];
  artistName?: string;
  className?: string;
  /** Called after the album is edited, with the freshly updated album row. */
  onAlbumUpdated?: (album: Album) => void;
  /** Called after the album is successfully deleted (e.g. to close the popup showing it). */
  onDeleted?: () => void;
}

export function AlbumOptionsMenu({ album, tracks, artistName, className, onAlbumUpdated, onDeleted }: Props) {
  const { addToQueue } = useAudio();
  const { openArtist } = usePopups();

  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEmpty = tracks.length === 0;

  const handleAddToQueue = () => {
    if (!tracks || tracks.length === 0) return;
    const tracksWithArtist = tracks.map((track) => ({
      ...track,
      artist: artistName || "Unknown Artist",
    }));
    addToQueue(tracksWithArtist);
  };

  const handleGoToArtist = () => {
    if (album.artist_id) openArtist(album.artist_id);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/albums/${album.album_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete album");
      setShowDeleteConfirm(false);
      onDeleted?.();
    } catch (error) {
      console.error("[AlbumOptionsMenu] Failed to delete album:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <OptionsMenu
        className={className}
        options={[
          { label: "Add Album to Queue", onClick: handleAddToQueue, disabled: isEmpty },
          { label: "Add Album to Playlist", onClick: () => setShowAddToPlaylist(true), disabled: isEmpty },
          { label: "Go to Artist", onClick: handleGoToArtist, disabled: !album.artist_id },
          { label: "Edit Album", onClick: () => setShowEdit(true) },
          ...(isEmpty
            ? [{ label: "Delete Album", onClick: () => setShowDeleteConfirm(true), danger: true }]
            : []),
        ]}
      />

      {showAddToPlaylist && (
        <AddToPlaylistPopup
          trackIds={tracks.map((t) => t.track_id)}
          fallbackCoverTrack={tracks[0]}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}

      {showEdit && (
        <EditAlbumModal
          album={album}
          initialArtistName={artistName}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => onAlbumUpdated?.(updated)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete this album?"
          message={`"${album.title}" has no tracks left in it. Deleting it can't be undone.`}
          isSubmitting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
