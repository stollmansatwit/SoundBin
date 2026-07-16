import { useState } from 'react'
import { ScrollableAlbums } from '../components/scrollable/ScrollableAlbums'
import { NavBar } from '../components/NavBar'
import { RecentListenTable } from '../components/scrollable/RecentListenTable'
import { ScrollablePlaylists } from '../components/scrollable/ScrollablePlaylists'
import { UploadButton } from '../components/UploadFileButton'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { Upload } from '../components/Upload'



export default function App() {
  const [isNavOpen, setIsNavOpen] = useState(false)

  const openNav = () => {
    setIsNavOpen(true)
  }

  const closeNav = () => {
    setIsNavOpen(false)
  }


  const [showUpload, setShowUpload] = useState(false);

  const openUpload = () => {
    setShowUpload(true);
  };

  const closeUpload = () => {
    setShowUpload(false);
  };

  return (

    <div className={`min-h-screen bg-linear-to-t from-orange-500 to-gray-500 font-bold transition-[padding-left] duration-300 ${isNavOpen ? 'pl-32' : 'pl-16'}`}>
      <Upload onOpen={openUpload} />
      <Header />
      <SearchBar />
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />
      {/* <ScrollablePlaylists /> */}
      <ScrollableAlbums />
      <RecentListenTable />
      {showUpload && (
        <UploadButton onClose={closeUpload}/>
      )}
    </div>

  )
}


