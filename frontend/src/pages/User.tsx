import { useEffect, useState } from 'react'
import {NavBar} from '../components/NavBar'
import { Header } from '../components/Header'

type User = {
  username: string;
  display_name: string;
  is_active: boolean;
  last_login: Date | null;
};

export default function User() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const openNav = () => {
    setIsNavOpen(true)
  }

  const closeNav = () => {
    setIsNavOpen(false)
  }
  
  // fetch user from backend and display user info
  useEffect(() => {
      const apiBaseUrl = 'http://localhost:3000/api/user';
  
      const fetchJson = async <T,>(path: string): Promise<T> => {
        const response = await fetch(`${apiBaseUrl}${path}`);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status} for ${path}`);
        }
        return response.json() as Promise<T>;
      };

    fetchJson<User>('')
      .then(data => {
        setUser(data);
      })
      .catch(error => {
        console.error('Error fetching user:', error);
      });
  }, []);

  return (
    <div className={`min-h-screen bg-linear-to-t from-orange-500 to-gray-500 font-bold transition-[padding-left] duration-300 ${isNavOpen ? 'pl-32' : 'pl-16'}`}>
      <Header />
      <NavBar isOpen={isNavOpen} openNav={openNav} closeNav={closeNav} />
      <div className="p-4">
        <h2 className="text-2xl font-bold text-white">Hello, {user?.display_name || 'User'}</h2>
        <p className="text-gray-300">This is the user page.</p>
        {user && (
          <div className="mt-4">
            <p className="text-gray-300">Username: {user.username}</p>
            <p className="text-gray-300">Display Name: {user.display_name}</p>
            <p className="text-gray-300">Is Active: {user.is_active ? 'Yes' : 'No'}</p>
            <p className="text-gray-300">Last Login: {user.last_login ? user.last_login.toLocaleString() : 'Never'}</p>
          </div>
        )}
      </div>
    </div>
  )
}


