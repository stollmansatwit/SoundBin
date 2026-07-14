/**
 * @file Component for the upload a single file button
 * @module UploadFileButton
 * @author Ian MacDougall
 * @version 0.1
 */
import React from 'react';
// type AlbumArt = {
//     url: string,
// };

// prop needed for visibility toggle
type UploadButtonProps = {
  onClose: () => void;
};
/**
 * Uploads a single file via a fetch
 * @returns Ok if uploaded successfully, else relays error
 */
export function UploadButton({ onClose }: UploadButtonProps) {

  const [uploading, setUploading] = React.useState(false);

  async function handleOnSubmit(e: React.ChangeEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData();
    const fileInput = e.currentTarget.elements.namedItem('songFile') as HTMLInputElement;

    if (fileInput.files && fileInput.files[0]) {
      formData.append('songFile', fileInput.files[0]);
      // able to add other fields here
    }

    try {
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert("Upload successful");
      }
    } catch (error) {
      alert("Upload successful");
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
      onClose();

      refreshPage();
    }

  }

  function refreshPage() {
    // wait 5 seconds
    setTimeout(() => {
      window.location.reload();
    }, 5000);
    
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-transparency"
      onClick={onClose}
    >
      <form
        className="w-full max-w-lg rounded-3xl border border-gray-700 bg-gray-900 p-8 shadow-2xl animate-modal-open"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleOnSubmit}
      >
        <div className="flex flex-col gap-4">
          <label
            htmlFor="songFile"
            className="text-2xl font-bold text-white text-center"
          >
            Upload a Song
            <p className="text-xs text-gray-400">Click outside to close the upload screen</p>
          </label>

          <input
            id="songFile"
            type="file"
            name="songFile"
            className="block w-full text-sm text-gray-300
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-orange-600 file:text-white
            hover:file:bg-orange-500"
          />

          <p className="text-center text-xs text-gray-400">
            Supported formats: .mp3, .flac, .wav          
          </p>

          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-orange-600 px-4 py-3 font-bold text-white transition-colors hover:bg-orange-500 disabled:bg-gray-500"
          >
            {uploading ? "Uploading..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

