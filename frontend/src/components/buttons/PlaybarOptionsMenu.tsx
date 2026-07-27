import { useMemo, useState } from "react";
import { OptionsMenu } from "./OptionsMenu";
import { usePopups } from "../../context/PopupContext";
import AddToPlaylistPopup from "../popUpPage/AddToPlaylistPopup";
import type { Track } from "../../types";

const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

interface Props {
  track: Track;
  className?: string;
  buttonClassName?: string;
}

export function PlaybarOptionsMenu({ track, className, buttonClassName }: Props) {
  const { openAlbum, openArtist } = usePopups();
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  // Stable reference across re-renders — PlaybackControlBar (this
  // component's ultimate parent) re-renders continuously while a track
  // plays (progress bar / time text updating on every timeupdate tick),
  // so a plain inline `[track.track_id]` would be a brand-new array on
  // every single one of those renders.
  const trackIds = useMemo(() => [track.track_id], [track.track_id]);

  const handleGoToAlbum = () => {
    if (track.album_id) openAlbum(track.album_id);
  };

  const handleGoToArtist = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/track-artist?trackID=${track.track_id}`);
      if (res.ok) {
        const data = await res.json();
        const artistId = data?.contributors?.[0]?.artist?.artist_id;
        if (artistId) openArtist(artistId);
      }
    } catch (error) {
      console.error("[PlaybarOptionsMenu] Failed to resolve artist:", error);
    }
  };

  return (
    <>
      <OptionsMenu
        className={className}
        buttonClassName={buttonClassName}
        options={[
          { label: "Go to Album", onClick: handleGoToAlbum, disabled: !track.album_id },
          { label: "Go to Artist", onClick: handleGoToArtist },
          { label: "Add to Playlist", onClick: () => setShowAddToPlaylist(true) },
        ]}
      />

      {showAddToPlaylist && (
        <AddToPlaylistPopup
          trackIds={trackIds}
          fallbackCoverTrack={track}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}
    </>
  );
}
