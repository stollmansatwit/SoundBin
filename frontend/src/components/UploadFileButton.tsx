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

/**
 * Uploads a single file via a fetch
 * @returns Ok if uploaded successfully, else relays error
 */
export function UploadButton() {

  const [uploading, setUploading] = React.useState(false);
  
  async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    } catch (error){
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }

  }

  return (
    <div className="relative flex items-center m40">
      <form 
        className='w-[250px] inline-block p-4 border rounded bg-white shadow-sm'
        onSubmit={handleOnSubmit} // This will now correctly trigger your logic
      >
        <div className="flex flex-col gap-3">
          <label htmlFor="songFile" className="text-sm font-bold text-gray-700">
            Select a song
          </label>
          <input 
            id="songFile"
            type="file" 
            name="songFile"
            className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100" 
          />
          
          <p className="text-[10px] text-gray-400">Supported formats: .mp3, .flac, .wav</p>
          <button 
            type="submit" 
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 text-sm font-bold"
          >
            {uploading ? 'Uploading...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}

