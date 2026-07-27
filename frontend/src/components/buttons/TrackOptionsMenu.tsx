import { useState } from "react";
import { OptionsMenu } from "./OptionsMenu";
import { useAudio } from "../../context/AudioContext";
import { usePopups } from "../../context/PopupContext";
import AddToPlaylistPopup from "../popUpPage/AddToPlaylistPopup";
import EditTrackModal from "../popUpPage/EditTrackModal";
import type { Track } from "../../types";

const apiBaseUrl: string = "http://localhost:3000"; //Replace with `${process.env.APPLICATION_URL}:${process.env.BACKEND_PORT}`;

interface Props {
  track: Track;
  artistId?: number | null;
  artistName?: string;
  albumTitle?: string;
  className?: string;
}

export function TrackOptionsMenu({ track, artistId, artistName, albumTitle, className }: Props) {
  const { addToQueue } = useAudio();
  const { openAlbum, openArtist } = usePopups();

  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [resolvedArtistId, setResolvedArtistId] = useState<number | null>(artistId ?? null);
  const [resolvedArtistName, setResolvedArtistName] = useState<string>(artistName ?? "");
  const [resolvedAlbumTitle, setResolvedAlbumTitle] = useState<string>(albumTitle ?? "");

  const fetchFullTrack = async (): Promise<Track> => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/tracks/${track.track_id}`);
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
        const res = await fetch(`${apiBaseUrl}/api/track-artist?trackID=${track.track_id}`);
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
        const res = await fetch(`${apiBaseUrl}/api/track-artist?trackID=${track.track_id}`);
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

  const handleOpenEdit = async () => {
    if (!resolvedArtistName) {
      try {
        const res = await fetch(`${apiBaseUrl}/api/track-artist?trackID=${track.track_id}`);
        if (res.ok) {
          const data = await res.json();
          const contributor = data?.contributors?.[0]?.artist;
          if (contributor) {
            setResolvedArtistId(contributor.artist_id);
            setResolvedArtistName(contributor.name);
          }
        }
      } catch (error) {
        console.error("[TrackOptionsMenu] Failed to resolve artist for edit:", error);
      }
    }
    if (!resolvedAlbumTitle && track.album_id) {
      try {
        const res = await fetch(`${apiBaseUrl}/api/album-title?albumID=${track.album_id}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.title) setResolvedAlbumTitle(data.title);
        }
      } catch (error) {
        console.error("[TrackOptionsMenu] Failed to resolve album for edit:", error);
      }
    }
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
          initialArtistName={resolvedArtistName}
          initialAlbumTitle={resolvedAlbumTitle}
          onClose={() => setShowEdit(false)}
          onSaved={() => { /* Popups fetch fresh data on open; nothing to refresh in-place here. */ }}
        />
      )}
    </>
  );
}
