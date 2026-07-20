import React, { useEffect } from 'react'
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
            <div className = 'absolute right-5 top-4 transition-opacity ease-out duration-[1000ms] opacity-0 base-state:opacity-100'>
                <h1 className='text-white'>{healthStatus?.ok ?  <div className = 'text-green-300'>Database Connected</div> : <div className = 'text-red-300'>Database Disconnected</div>}</h1>
            </div>
        </>
    )
}