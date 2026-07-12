import { useState } from 'react'
import { NavBar } from '../components/NavBar'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'

export default function Library() {
  const [isNavOpen, setIsNavOpen] = useState(false)


  const openNav = () => {
    setIsNavOpen(true)
  }

  const closeNav = () => {
    setIsNavOpen(false)
  }


  return (
    <div className={`min-h-screen bg-linear-to-t from-orange-500 to-gray-500 font-bold transition-[padding-left] duration-300 ${isNavOpen ? 'pl-32' : 'pl-16'}`}>
      <Header />
      <SearchBar />
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />
      <div className="w-1/3 flex align-center justify-center p-4 float-start">
        <h2 className="text-2xl font-bold text-white">Recently Played</h2>
      </div>
      <div className="w-1/3 flex align-center justify-center p-4 float-start">
        <h2 className="text-2xl font-bold text-white">All Songs</h2>
      </div>
      <div className="w-1/3 flex align-center justify-center p-4 float-start">
        <h2 className="text-2xl font-bold text-white">All Albums</h2>
      </div>

      <div className="flex p-4 gap-4 w-1/3 float-start">
        <table className= "border [&>tr]:border [&>tr]:text-center  text-white flex-1">
          <tr className = "[&>th]:border">
            <th>Song</th>
            <th>Artist</th>
            <th>Album</th>
          </tr>
          <tr className = "[&>td]:border">
            <td>1</td>
            <td>2</td>
            <td>3</td>
          </tr>
          <tr className = "[&>td]:border">
            <td>1</td>
            <td>2</td>
            <td>3</td>
          </tr>
        </table>
      </div>
      
      <div className="flex p-4 gap-4 w-1/3 float-start">
        <table className= "border [&>tr]:border [&>tr]:text-center  text-white flex-1">
          <tr className = "[&>th]:border">
            <th>Song</th>
            <th>Artist</th>
            <th>Album</th>
          </tr>
          <tr className = "[&>td]:border">
            <td>1</td>
            <td>2</td>
            <td>3</td>
          </tr>
          <tr className = "[&>td]:border">
            <td>1</td>
            <td>2</td>
            <td>3</td>
          </tr>
        </table>
      </div>
      <div className="flex p-4 gap-4 w-1/3 float-start">
        <table className= "border [&>tr]:border [&>tr]:text-center  text-white flex-1">
          <tr className = "[&>th]:border">
            <th>Song</th>
            <th>Artist</th>
            <th>Album</th>
          </tr>
          <tr className = "[&>td]:border">
            <td>1</td>
            <td>2</td>
            <td>3</td>
          </tr>
          <tr className = "[&>td]:border">
            <td>1</td>
            <td>2</td>
            <td>3</td>
          </tr>
        </table>
      </div>
    </div>
  )
}
