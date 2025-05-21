import { SensorDevice, TrafficSensorReading, GlobalWeatherConfig } from '../types';
import { TrafficPatternMode } from '@/stores/useSimulatorStore';
import { SensorEmulator,TrafficVariabilityConfig } from './SensorEmulator';

export class BatchProcessor {
    private interval?: NodeJS.Timeout;
    private lastTickTime: number = Date.now();
    private speedMultiplier: number;
    private readonly TICK_INTERVAL = 1000;
    private emulators: Map<string, SensorEmulator> = new Map();

    constructor(
        devices: SensorDevice[],
        weatherConfig: GlobalWeatherConfig,
        trafficPattern: TrafficPatternMode,
        initialSpeed: number = 1,
        private onStateUpdate: (
            deviceId: string, 
            phase: 'RED' | 'GREEN',
            queueSize: number,
            timeRemaining: number,
            vehiclesPassed: number,
            lastReading: TrafficSensorReading | null
        ) => void,
        private onReading: (reading: TrafficSensorReading) => void
    ) {
        this.speedMultiplier = Math.max(0.1, Math.min(10, initialSpeed));
        this.initializeEmulators(devices, weatherConfig, trafficPattern);
    }

    private initializeEmulators(
        devices: SensorDevice[], 
        weatherConfig: GlobalWeatherConfig,
        trafficPattern: TrafficPatternMode
    ): void {
        devices.forEach(device => {
            const emulator = new SensorEmulator(
                device,
                weatherConfig,
                trafficPattern,
                this.createVariabilityConfig(device),
                this.onStateUpdate,
                this.onReading
            );
            this.emulators.set(device.deviceId, emulator);
        });
    }

    private createVariabilityConfig(device: SensorDevice): TrafficVariabilityConfig {
        return {
            clear: {
                arrivalRange: [0, device.characteristics.peakQueue * 0.6],
                serviceModifier: 0.8,
            },
            congested: {
                arrivalRange: [
                    device.characteristics.averageQueue * 0.8, 
                    device.characteristics.peakQueue
                ],
                serviceModifier: 1.3,
            },
            dynamic: {
                clearProbability: 0.4,
                congestedProbability: 0.6,
                inertiaFactor: 0.8,
                baseVolatility: 0.3,
                queueImpactFactor: 0.4,
                recoveryRate: 0.2
            },
        };
    }

    public start(deviceId?: string): void {
        if (deviceId) {
            const emulator = this.emulators.get(deviceId);
            if (emulator) emulator.start();
        } else {
            if (this.interval) return;
            
            this.lastTickTime = Date.now();
            this.interval = setInterval(() => {
                const currentTime = Date.now();
                const deltaSeconds = ((currentTime - this.lastTickTime) / 1000) * this.speedMultiplier;
                this.lastTickTime = currentTime;

                this.emulators.forEach(emulator => {
                    if (emulator.isActive()) {
                        emulator.processTick(deltaSeconds);
                    }
                });
            }, this.TICK_INTERVAL);
        }
    }

    public stop(deviceId?: string): void {
        if (deviceId) {
            const emulator = this.emulators.get(deviceId);
            if (emulator) emulator.stop();
        } else {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = undefined;
            }
            this.emulators.forEach(emulator => emulator.stop());
        }
    }

    public setSpeedMultiplier(speed: number): void {
        this.speedMultiplier = Math.max(0.1, Math.min(10, speed));
    }

    public updateWeatherConfig(config: GlobalWeatherConfig): void {
        this.emulators.forEach(emulator => emulator.updateWeatherConfig(config));
    }

    public updateTrafficPattern(pattern: TrafficPatternMode): void {
        this.emulators.forEach(emulator => emulator.updateTrafficPattern(pattern));
    }

    public isRunning(): boolean {
        return !!this.interval;
    }

    public getActiveEmulators(): SensorEmulator[] {
        return Array.from(this.emulators.values()).filter(e => e.isActive());
    }
}