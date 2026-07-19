import React from 'react'
import { Link } from 'react-router-dom'
import { HealthCheck } from './HealthCheck'
export function Header() {
  return (
    <>
    <Link to="/home">
    <h1 className='flex justify-center bg-transparent shadow-lg p-4 text-white'>SoundBin</h1>
    <HealthCheck />
    </Link>
    </>
  )
}