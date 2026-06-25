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
      formData.append('file', fileInput.files[0]);
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
        onSubmit={handleOnSubmit} 
        className="w-[250px] inline-block p-4 border rounded shadow-sm"
      >
        <div className="flex flex-col gap-3">
          <label htmlFor="songFile" className="text-sm font-bold">Select a song</label>
          <input 
            id="songFile"
            type="file" 
            name="songFile" 
            className="block w-full text-sm"
          />
          <button 
            type="submit" 
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {uploading ? 'Uploading...' : 'Upload song'}
          </button>
        </div>
      </form>
    </div>
  );
}

