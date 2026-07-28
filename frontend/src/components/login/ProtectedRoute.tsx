// components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authFetch,  } from '../../utils/api';
import { API_BASE_URL } from '../../config';

export function ProtectedRoute() {
  const [status, setStatus] = useState<'checking' | 'authed' | 'unauthed'>('checking');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('unauthed');
      return;
    }

    authFetch(`${API_BASE_URL}/api/user`)
      .then((res) => {
        if (res.ok) {
          setStatus('authed');
        } else {
          localStorage.removeItem('token'); // clear invalid/expired token
          setStatus('unauthed');
        }
      })
      .catch(() => {
        setStatus('unauthed');
      });
  }, []);

  if (status === 'checking') {
    return <div>Loading...</div>; // or a spinner
  }

  if (status === 'unauthed') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}