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

    const ok = healthStatus?.ok;
    return (
        <div className='flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap'>
            <span className={`inline-block h-2 w-2 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`} aria-hidden="true" />
            <span className={ok ? 'text-green-200' : 'text-red-200'}>
                <span className='sm:hidden'>{ok ? 'DB OK' : 'DB down'}</span>
                <span className='hidden sm:inline'>{ok ? 'Database Connected' : 'Database Disconnected'}</span>
            </span>
        </div>
    )
}