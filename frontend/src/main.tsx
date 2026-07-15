import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './pages/App.tsx';
import {NavBar} from './components/NavBar.tsx';
import Library from './pages/Library.tsx';
import Stats from './pages/Stats.tsx';
import User from './pages/User.tsx';
import { Columns } from './pages/Columns.tsx';

import { AudioProvider } from './context/AudioContext';

const router = createBrowserRouter([
  {path: '/', element: <App />},
  {path: '/navbar', element: <NavBar isOpen={false} openNav={function (): void {
    throw new Error('Function not implemented.');
  } } closeNav={function (): void {
    throw new Error('Function not implemented.');
  } } />},
  {path: '/columns', element: <Columns />},
  {path: '/user', element: <User/>},
  {path: '/library', element: <Library/>},
  {path: '/home', element: <App />},
  {path: '/stats', element: <Stats/>},
]);



const getTrackAudioUrl = async (trackId: number): Promise<string | null> => {
  const apiBaseUrl = 'http://localhost:3000'; 
 
  try {
    const response = await fetch(`${apiBaseUrl}/api/tracks/${trackId}`);

    if (!response.ok) {
      console.error(`Failed to fetch track ${trackId}`);
      return null;
    }

    const trackData = await response.json();
    const file = trackData.files?.[0];

    if (!file || !file.storage_path_url) {
      console.error(`No file found for track ${trackId}`);
      return null;
    }
    console.log(`file path: ${file.storage_path_url}`)
    const publicPath = file.storage_path_url.replace('/app/uploads/','');
    return `${apiBaseUrl}/${publicPath}`;
  } catch (error) {
    console.error('Error resolving track URL:', error);
    return null;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 3. Wrap RouterProvider with AudioProvider */}
    <AudioProvider getTrackUrl={getTrackAudioUrl}>
      <RouterProvider router={router} />
    </AudioProvider>
  </StrictMode>,
)