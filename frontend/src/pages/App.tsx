import { useState } from 'react';
import { ScrollableAlbums } from '../components/scrollable/ScrollableAlbums';
import { ScrollableArtists } from '../components/scrollable/ScrollableArtists';
import { ScrollableTracks } from '../components/scrollable/ScrollableTracks';
import { ScrollablePlaylists } from '../components/scrollable/ScrollablePlaylists';
import { NavBar } from '../components/NavBar';
import { RecentListenTable } from '../components/scrollable/RecentListenTable';
import { UploadButton } from '../components/UploadFileButton';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { Upload } from '../components/Upload';
import { PlaybackControlBar } from '../components/playback/PlaybackControlBar';




export default function App() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const getLeftPosition = () => {
    return isNavOpen ? 'left-[calc(8rem+1rem)]' : 'left-[calc(4rem+1rem)]';
  };

  //const getTrackUrl = 


  return (

    <div className={`min-h-screen bg-linear-to-t from-orange-500 to-gray-500 font-bold transition-[padding-left] duration-300 ${isNavOpen ? 'pl-32' : 'pl-16'}`}>
      <Upload onOpen={() => setShowUpload(true)} />
      <Header />
      <SearchBar />
      <NavBar isOpen={isNavOpen} openNav={() => setIsNavOpen(true)} closeNav={() => setIsNavOpen(false)} />
      {/* <ScrollablePlaylists /> */}
      <ScrollableAlbums />
      <RecentListenTable />
      <ScrollableArtists />
      <ScrollableTracks />
      <ScrollablePlaylists />
      {showUpload && (
        <UploadButton onClose={() => setShowUpload(false)}/>
      )}
      <div className={`fixed bottom-4 z-40 w-[calc(100%-2rem)] max-w-3xl mx-auto ${getLeftPosition()}`}>
        <PlaybackControlBar />
      </div>
    </div>

  )
}