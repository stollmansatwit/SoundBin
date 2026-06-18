import { SchemaColumns } from './components/SchemaColumns'
import { ScrollableAlbums } from './components/ScrollableAlbums'
import NavBar from './components/NavBar'



function App() {
  return (

    <div className = 'h-full font-bold bg-gradient-to-t from-orange-500 to-gray-500' >
      <h1 className = 'flex fixed top-0 left-0 right-0 justify-center p-4 bg-gray-800 text-white'>Welcome to 🎵 SoundBin.</h1>
      {/* <SchemaColumns /> */}
      <ScrollableAlbums />
      <NavBar />
    </div>

  )
}

export default App
