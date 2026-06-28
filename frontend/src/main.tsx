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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
