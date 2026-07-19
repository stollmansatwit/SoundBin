import React, { useEffect } from 'react'
import icon from '../assets/icons8-check-mark-60.png'
export function HealthCheck() {
    const [healthStatus, setHealthStatus] = React.useState<{ ok: boolean; db: string } | null>(null);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/health');
                const data = await response.json();
                setHealthStatus(data);
                console.log('Health Check:', data);
            } catch (error) {
                console.error('Error checking health:', error);
            }
        };
        checkHealth();
    }, []);

    return (
        <>
            <div className = 'absolute right-5 top-4'>
                <h1 className='text-white hover:underline'>{healthStatus?.ok ?  <div className = 'text-green-300'>Database Connected</div> : <div className = 'text-red-300'>Database Disconnected</div>}</h1>
            </div>
        </>
    )
}