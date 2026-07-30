import { useState } from "react";
import { OptionsMenu } from "./OptionsMenu";
import { useAudio } from "../../context/AudioContext";
import { usePopups } from "../../context/PopupContext";
import AddToPlaylistPopup from "../popUpPage/AddToPlaylistPopup";
import EditTrackModal from "../popUpPage/edit/EditTrackModal";
import type { Track } from "../../types";
import { API_BASE_URL } from '../../config';


interface Props {
  track: Track;
  artistId?: number | null;
  artistName?: string;
  albumTitle?: string;
  className?: string;
  /** Called after the track is edited, so the list showing it can refetch. */
  onTrackUpdated?: () => void;
}

export function TrackOptionsMenu({ track, artistId, artistName, className, onTrackUpdated }: Props) {
  const { addToQueue } = useAudio();
  const { openAlbum, openArtist } = usePopups();

  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [resolvedArtistId, setResolvedArtistId] = useState<number | null>(artistId ?? null);
  const [resolvedArtistName, setResolvedArtistName] = useState<string>(artistName ?? "");

  const fetchFullTrack = async (): Promise<Track> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tracks/${track.track_id}`);
      if (!res.ok) throw new Error("Failed to fetch track");
      return await res.json();
    } catch (error) {
      console.error("[TrackOptionsMenu] Failed to fetch full track:", error);
      return track;
    }
  };

  const handleAddToQueue = async () => {
    const fullTrack = await fetchFullTrack();

    let artist = resolvedArtistName;
    if (!artist) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/track-artist?trackID=${track.track_id}`);
        if (res.ok) {
          const data = await res.json();
          const contributor = data?.contributors?.[0]?.artist;
          if (contributor) {
            artist = contributor.name;
            setResolvedArtistId(contributor.artist_id);
            setResolvedArtistName(contributor.name);
          }
        }
      } catch (error) {
        console.error("[TrackOptionsMenu] Failed to resolve artist for queue:", error);
      }
    }

    addToQueue([{ ...fullTrack, artist: artist || "Unknown Artist" }]);
  };

  const handleGoToArtist = async () => {
    let id = resolvedArtistId;
    if (!id) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/track-artist?trackID=${track.track_id}`);
        if (res.ok) {
          const data = await res.json();
          id = data?.contributors?.[0]?.artist?.artist_id ?? null;
        }
      } catch (error) {
        console.error("[TrackOptionsMenu] Failed to resolve artist:", error);
      }
    }
    if (id) openArtist(id);
  };

  const handleGoToAlbum = () => {
    if (track.album_id) openAlbum(track.album_id);
  };

  const handleOpenEdit = () => {
    // EditTrackModal fetches the track's full details (cover art, release
    // date, genres, contributors) itself on open.
    setShowEdit(true);
  };

  return (
    <>
      <OptionsMenu
        className={className}
        options={[
          { label: "Add to Queue", onClick: handleAddToQueue },
          { label: "Add to Playlist", onClick: () => setShowAddToPlaylist(true) },
          { label: "Go to Artist", onClick: handleGoToArtist },
          { label: "Go to Album", onClick: handleGoToAlbum },
          { label: "Edit Song", onClick: handleOpenEdit },
        ]}
      />

      {showAddToPlaylist && (
        <AddToPlaylistPopup
          trackIds={[track.track_id]}
          fallbackCoverTrack={track}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}

      {showEdit && (
        <EditTrackModal
          track={track}
          onClose={() => setShowEdit(false)}
          onSaved={() => onTrackUpdated?.()}
        />
      )}
    </>
  );
}
