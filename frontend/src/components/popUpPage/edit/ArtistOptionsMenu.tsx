import { useState } from "react";
import { OptionsMenu } from "../../buttons/OptionsMenu";
import EditArtistModal from "./EditArtistModal";
import type { Artist } from "../../../types";

interface Props {
  artist: Artist;
  onArtistUpdated?: (artist: Artist) => void;
  className?: string;
  buttonClassName?: string;
}

export function ArtistOptionsMenu({ artist, onArtistUpdated, className, buttonClassName }: Props) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <OptionsMenu
        className={className}
        buttonClassName={buttonClassName}
        options={[
          { label: "Edit Artist", onClick: () => setShowEdit(true) },
        ]}
      />

      {showEdit && (
        <EditArtistModal
          artist={artist}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => onArtistUpdated?.(updated)}
        />
      )}
    </>
  );
}
