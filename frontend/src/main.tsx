import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import {NavBar} from './components/NavBar.tsx';
import { SchemaColumns } from './components/SchemaColumns.tsx';

const router = createBrowserRouter([
  {path: '/', element: <App />},
  {path: '/navbar', element: <NavBar />},
  {path: '/columns', element: <SchemaColumns />},
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
