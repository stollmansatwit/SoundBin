import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    // Use Docker service name in Docker environment, localhost for local dev
    const backendUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/health'
      : 'http://backend:3000/api/health'
    
    fetch(backendUrl)
      .then(res => res.json())
      .then(data => {
        setStatus(JSON.stringify(data, null, 2))
      })
      .catch(err => {
        setStatus(`Error: ${err.message}`)
      })

  }, [])

  return (
    <div style={{ padding: '2rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome to 🎵 SoundBin.</h1>
      <pre style={{ backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '0.375rem' }}>
        {status}
      </pre>
    </div>
  )
}

export default App
