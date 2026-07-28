import { OptionsMenu } from "./OptionsMenu";
import { usePopups } from "../../context/PopupContext";
import type { Track } from "../../types";
import { API_BASE_URL } from '../../config';


interface Props {
  track: Track;
  onRemove: () => void;
  className?: string;
  buttonClassName?: string;
}

/**
 * The vertical "..." menu attached to each upcoming-track row in the Queue.
 * Gives the user quick access to remove the track from the queue, or jump
 * to its album / artist.
 */
export function QueueItemOptionsMenu({ track, onRemove, className, buttonClassName }: Props) {
  const { openAlbum, openArtist } = usePopups();

  const handleGoToAlbum = () => {
    if (track.album_id) openAlbum(track.album_id);
  };

  const handleGoToArtist = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/track-artist?trackID=${track.track_id}`);
      if (res.ok) {
        const data = await res.json();
        const artistId = data?.contributors?.[0]?.artist?.artist_id;
        if (artistId) openArtist(artistId);
      }
    } catch (error) {
      console.error("[QueueItemOptionsMenu] Failed to resolve artist:", error);
    }
  };

  return (
    <OptionsMenu
      className={className}
      buttonClassName={buttonClassName}
      align="right"
      ariaLabel="Track options"
      options={[
        { label: "Remove from Queue", onClick: onRemove, danger: true },
        { label: "Go to Album", onClick: handleGoToAlbum, disabled: !track.album_id },
        { label: "Go to Artist", onClick: handleGoToArtist },
      ]}
    />
  );
}
