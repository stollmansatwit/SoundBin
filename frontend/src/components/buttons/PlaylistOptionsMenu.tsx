import { useState } from "react";
import { OptionsMenu } from "./OptionsMenu";
import { useAudio } from "../../context/AudioContext";
import EditPlaylistModal from "../popUpPage/edit/EditPlaylistModal";
import ConfirmDialog from "../popUpPage/ConfirmDialog";
import type { Playlist, Track } from "../../types";
import { API_BASE_URL } from '../../config';


interface Props {
  playlist: Playlist;
  tracks: Track[];
  onPlaylistUpdated?: (playlist: Playlist) => void;
  /** Called after the playlist is successfully deleted (e.g. to close the popup showing it). */
  onDeleted?: () => void;
  className?: string;
}

export function PlaylistOptionsMenu({ playlist, tracks, onPlaylistUpdated, onDeleted, className }: Props) {
  const { addToQueue } = useAudio();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEmpty = tracks.length === 0;

  const handleAddToQueue = () => {
    if (!tracks || tracks.length === 0) return;
    addToQueue(tracks);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/playlists/${playlist.playlist_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete playlist");
      setShowDeleteConfirm(false);
      onDeleted?.();
    } catch (error) {
      console.error("[PlaylistOptionsMenu] Failed to delete playlist:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <OptionsMenu
        className={className}
        options={[
          { label: "Add to Queue", onClick: handleAddToQueue, disabled: isEmpty },
          { label: "Edit Playlist", onClick: () => setShowEdit(true) },
          ...(isEmpty
            ? [{ label: "Delete Playlist", onClick: () => setShowDeleteConfirm(true), danger: true }]
            : []),
        ]}
      />

      {showEdit && (
        <EditPlaylistModal
          playlist={playlist}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => onPlaylistUpdated?.(updated)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete this playlist?"
          message={`"${playlist.name}" has no tracks left in it. Deleting it can't be undone.`}
          isSubmitting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
