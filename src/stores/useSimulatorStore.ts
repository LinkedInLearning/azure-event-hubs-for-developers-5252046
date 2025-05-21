import { create } from 'zustand';
import { BatchProcessor } from '../services/simulator/EmulatorRunner';
import { SensorDevice, TrafficSensorReading, GlobalWeatherConfig } from '../services/types';
import eventHubService from '@/services/eventhub.service';

export enum TrafficPatternMode {
    CLEAR = "CLEAR",
    DYNAMIC = "DYNAMIC",
    CONGESTED = "CONGESTED"
}

interface SimulatorStateData {
    currentPhase: 'RED' | 'GREEN';
    queueSize: number;
    timeRemainingInPhase: number;
    vehiclesPassed: number;
    lastReading: TrafficSensorReading | null;
}

interface SimulatorState {
    sensorDevices: SensorDevice[];
    readings: Map<string, TrafficSensorReading>;
    simulatorStates: Map<string, SimulatorStateData>;
    activeSimulators: Set<string>;
    weatherConfig: GlobalWeatherConfig;
    simulationSpeed: number;
    trafficPatternMode: TrafficPatternMode;
    batchProcessor: BatchProcessor | null;
    eventHubStatus: {
        queuedEvents: number;
        sentEvents: number;
        failedEvents: number;
        lastSendTime: Date | null;
        lastErrorTime: Date | null;
        lastErrorMessage: string | null;
    };
    subscribeToEventHub:()=> void;
    updateEventHubStatus: (update: Partial<SimulatorState['eventHubStatus']>) => void;
    setSensorDevices: (devices: SensorDevice[]) => void;
    setWeatherConfig: (config: GlobalWeatherConfig) => void;
    setSimulationSpeed: (speed: number) => void;
    setTrafficPatternMode: (pattern: TrafficPatternMode) => void;
    startSimulator: (deviceId: string) => void;
    stopSimulator: (deviceId: string) => void;
    updateReading: (reading: TrafficSensorReading) => void;
    updateSimulatorState: (
        deviceId: string,
        phase: 'RED' | 'GREEN',
        queueSize: number,
        timeRemaining: number,
        vehiclesPassed: number,
        lastReading: TrafficSensorReading | null
    ) => void;
}

const defaultWeatherConfig: GlobalWeatherConfig = {
    condition: 'dry',
    temperature: 20,
    visibility: 100,
    precipitation: false,
    lightLevel: 100
};

export const useSimulatorStore = create<SimulatorState>((set, get) => ({


    
    sensorDevices: [],
    readings: new Map(),
    simulatorStates: new Map(),
    activeSimulators: new Set(),
    weatherConfig: defaultWeatherConfig,
    simulationSpeed: 1,
    trafficPatternMode: TrafficPatternMode.DYNAMIC,
    batchProcessor: null, 
     eventHubStatus: {
        queuedEvents: 0,
        sentEvents: 0,
        failedEvents: 0,
        lastSendTime: null,
        lastErrorTime: null,
        lastErrorMessage: null
    },
    
   
    updateEventHubStatus: (update) => {
        set(state => ({
            eventHubStatus: {
                ...state.eventHubStatus,
                ...update
            }
        }));
    },
    setSensorDevices: (devices) => {
        const currentState = get();
        
        // Stop existing batch processor if it exists
        if (currentState.batchProcessor) {
            currentState.batchProcessor.stop();
        }

        // Create new batch processor with current configuration
        const batchProcessor = new BatchProcessor(
            devices,
            currentState.weatherConfig,
            currentState.trafficPatternMode,
            currentState.simulationSpeed,
            // State update callback
            (deviceId, phase, queueSize, timeRemaining, vehiclesPassed, lastReading) => {
                get().updateSimulatorState(
                    deviceId, 
                    phase, 
                    queueSize, 
                    timeRemaining, 
                    vehiclesPassed, 
                    lastReading
                );
            },
            // Reading update callback
            (reading) => get().updateReading(reading)
        );

        set({ 
            sensorDevices: devices,
            batchProcessor,
            // Reset state collections
            readings: new Map(),
            simulatorStates: new Map(),
            activeSimulators: new Set()
        });
    },

    setWeatherConfig: (config) => {
        const { batchProcessor } = get();
        if (batchProcessor) {
            batchProcessor.updateWeatherConfig(config);
        }
        set({ weatherConfig: config });
    },

    setSimulationSpeed: (speed) => {
        const { batchProcessor } = get();
        if (batchProcessor) {
            batchProcessor.setSpeedMultiplier(speed);
        }
        set({ simulationSpeed: speed });
    },

    setTrafficPatternMode: (pattern) => {
        const { batchProcessor } = get();
        if (batchProcessor) {
            batchProcessor.updateTrafficPattern(pattern);
        }
        set({ trafficPatternMode: pattern });
    },

    startSimulator: (deviceId) => {
        const { batchProcessor, activeSimulators } = get();
        if (!batchProcessor) return;

        if (!batchProcessor.isRunning()) {
            batchProcessor.start();
        }
        batchProcessor.start(deviceId);
        
        set({ 
            activeSimulators: new Set([...activeSimulators, deviceId])
        });
    },

    stopSimulator: (deviceId) => {
        const { batchProcessor, activeSimulators, simulatorStates } = get();
        if (!batchProcessor) return;

        batchProcessor.stop(deviceId);
        
        // Remove from active set
        activeSimulators.delete(deviceId);
        
        // Clean up simulator state
        const newSimulatorStates = new Map(simulatorStates);
        newSimulatorStates.delete(deviceId);
        
        set({ 
            activeSimulators: new Set(activeSimulators),
            simulatorStates: newSimulatorStates
        });

        // If no active simulators, stop the batch processor
        if (activeSimulators.size === 0) {
            batchProcessor.stop();
        }
    },

    updateReading: (reading) => {
        // Send to event hub
        eventHubService.queueEvent(reading);
        
        // Update store
        set(state => ({
            readings: new Map(state.readings).set(reading.deviceId, reading)
        }));
    },

    updateSimulatorState: (
        deviceId, 
        phase, 
        queueSize, 
        timeRemaining,
        vehiclesPassed,
        lastReading
    ) => {
        set(state => ({
            simulatorStates: new Map(state.simulatorStates).set(deviceId, {
                currentPhase: phase,
                queueSize,
                timeRemainingInPhase: timeRemaining,
                vehiclesPassed,
                lastReading
            })
        }));
    },
    subscribeToEventHub: () => {
        // Register the callbacks
        eventHubService.setOnBatchSent((batchSize, partitionKey) => {
            set(state => ({
                eventHubStatus: {
                    ...state.eventHubStatus,
                    sentEvents: state.eventHubStatus.sentEvents + batchSize,
                    queuedEvents: Math.max(0, state.eventHubStatus.queuedEvents - batchSize),
                    lastSendTime: new Date()
                }
            }));
        });
        
        eventHubService.setOnBatchError((error, batchSize, partitionKey) => {
            set(state => ({
                eventHubStatus: {
                    ...state.eventHubStatus,
                    failedEvents: state.eventHubStatus.failedEvents + batchSize,
                    lastErrorTime: new Date(),
                    lastErrorMessage: error.message || 'Unknown error'
                }
            }));
        });
        
        // Return an unsubscribe function if needed
        return () => {
            eventHubService.setOnBatchSent(null);
            eventHubService.setOnBatchError(null);
        };
    }
}));

useSimulatorStore.getState().subscribeToEventHub();
