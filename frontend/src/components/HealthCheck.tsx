import { useEffect, useState } from 'react'
export function HealthCheck() {
    const [healthStatus, setHealthStatus] = useState<{ ok: boolean; db: string } | null>(null);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/health');
                const data = await response.json();
                setHealthStatus(data);
            } catch (error) {
                console.error('Error checking health:', error);
            }
        };
        checkHealth();
    }, []);

    return (
        <>
            <div className = 'absolute right-5 top-4'>
                <h1 className='text-white'>{healthStatus?.ok ?  <div className = 'text-green-200'>Database Connected</div> : <div className = 'text-red-200'>Database Disconnected</div>}</h1>
            </div>
        </>
    )
}