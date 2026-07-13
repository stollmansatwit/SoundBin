import { useState } from 'react'
import { NavBar } from '../components/NavBar'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { RecentListenTable } from '../components/scrollable/RecentListenTable'

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
      <RecentListenTable />
    </div>
  )
}
