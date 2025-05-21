"use client";

import { create } from 'zustand'
import { SensorDevice, SensorTraficStatus } from '@/services/types'

interface SensorState {
   sensors: SensorDevice[];
   selectedSensorId: string | null;
   latestStatuses: Map<string, SensorTraficStatus>;
   isLoading: boolean;
   error: Error | null;
   lastFetched: number | null;
   signalRStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
   signalRMessage: string | null;
   
   // Actions
      updateSignalRStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting', message?: string) => void;
   setSelectedSensor: (deviceId: string | null) => void;
   fetchSensors: () => Promise<void>;
   setSensors: (sensors: SensorDevice[]) => void;
   updateSensorStatuses: (statuses: SensorTraficStatus[]) => void;
   getLatestStatus: (deviceId: string) => SensorTraficStatus | undefined;
}

export const useSensorStore = create<SensorState>((set, get) => ({
   sensors: [],
   latestStatuses: new Map(),
   isLoading: false,
   error: null,
   lastFetched: null,
   selectedSensorId: null,
   signalRStatus: 'disconnected',
   signalRMessage: null,
   
   updateSignalRStatus: (status, message = null) => {
       set({ 
           signalRStatus: status, 
           signalRMessage: message 
       });
   },
   setSelectedSensor: (deviceId) => {
       set({ selectedSensorId: deviceId });
   },
   fetchSensors: async () => {
       const currentState = get();
       const now = Date.now();
       
       // If data was fetched in the last 10 seconds, don't fetch again
       if (currentState.lastFetched && 
           now - currentState.lastFetched < 10000 && 
           currentState.sensors.length > 0) {
           return;
       }

       // If already loading, don't start another fetch
       if (currentState.isLoading) {
           return;
       }

       set({ isLoading: true, error: null });
       try {
           const res = await fetch(`/api/sensors`);
           if (!res.ok) {
               throw new Error("Failed to fetch sensors");
           }
           const sensors = await res.json() as SensorDevice[];
           set({ 
               sensors, 
               isLoading: false, 
               lastFetched: now 
           });
       } catch (error) {
           set({ 
               error: error as Error, 
               isLoading: false 
           });
       }
   },

   setSensors: (sensors) => {
       set({ 
           sensors,
           lastFetched: Date.now()
       });
   },

   updateSensorStatuses: (statuses) => {
    console.log('sensor statuses udpated',statuses)
    set(state => {
        const updatedStatuses = new Map(state.latestStatuses);
        statuses.forEach(status => {
            updatedStatuses.set(status.deviceId, status);
        });
        return { latestStatuses: updatedStatuses };
    });
},


   getLatestStatus: (deviceId) => {
       return get().latestStatuses.get(deviceId);
   }
}));