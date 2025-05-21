// app/providers/SocketProvider.tsx
'use client';

import { useEffect, useState } from 'react';
import { SocketService } from '@/services/socket.service';
import { useSensorStore } from '@/stores/useSensorStore';
import { SensorTraficStatus } from '@/services/types';

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    // Get store actions
    const updateSensorStatuses = useSensorStore(state => state.updateSensorStatuses);

    useEffect(() => {
        const socketService = SocketService.getInstance();

        // Connection status handlers
        const handleConnect = () => {
            console.log('Socket connected');
            setIsConnected(true);
            setError(null);
        };

        const handleDisconnect = () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        };

        const handleError = (err: Error) => {
            console.error('Socket error:', err);
            setError(err);
        };

        // Sensor update handler
        const handleSensorUpdates = (statuses: SensorTraficStatus[]) => {
            
            try {
                updateSensorStatuses(statuses);
            } catch (err) {
                console.error('Error updating sensor status:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
            }
        };

        // Set up all listeners
        socketService.on('connect', handleConnect);
        socketService.on('disconnect', handleDisconnect);
        socketService.on('error', handleError);
        socketService.on('sensor-updates', handleSensorUpdates);

        // Check initial connection status
        setIsConnected(socketService.isConnected());

        // Cleanup
        return () => {
            socketService.off('connect', handleConnect);
            socketService.off('disconnect', handleDisconnect);
            socketService.off('error', handleError);
            socketService.off('sensor-update', handleSensorUpdates);
        };
    }, [updateSensorStatuses]);

    // Optionally render connection status or error messages
    if (error) {
        console.error('Socket error:', error);
        // You could render an error UI here if needed
    }

    return <>{children}</>;
}