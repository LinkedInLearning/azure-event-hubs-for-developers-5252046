import { SensorDevice, TrafficSensorReading, GlobalWeatherConfig } from '../types';
import { TrafficPatternMode } from '@/stores/useSimulatorStore';

export interface TrafficVariabilityConfig {
    clear: {
        arrivalRange: [number, number];
        serviceModifier: number;
    };
    congested: {
        arrivalRange: [number, number];
        serviceModifier: number;
    };
    dynamic: {
        clearProbability: number;
        congestedProbability: number;
        inertiaFactor: number;
        baseVolatility: number;
        queueImpactFactor: number;
        recoveryRate: number;
    };
}

interface GreenPhase {
    startTime: number;
    initialQueueSize: number;
    vehiclesPassed: number;
    departureAccumulator: number;
}

interface QueuedVehicle {
    enteredAt: number;
}

interface SensorState {
    currentPhase: 'RED' | 'GREEN';
    timeRemainingInPhase: number;
    currentGreenPhase: GreenPhase | null;
    lastReading: TrafficSensorReading | null;
    vehicleQueue: QueuedVehicle[];
    redTarget: number;
    redArrivalAccumulator: number;
    currentServiceModifier: number;
    congestionLevel: number;
    congestionTrend: number;
    isActive: boolean;
    lastCongestionState: boolean; 
}

export class SensorEmulator {
    private state: SensorState;
    private readonly BASE_PASSING_SPEED = 1200;

    constructor(
        private device: SensorDevice,
        private weatherConfig: GlobalWeatherConfig,
        private trafficPattern: TrafficPatternMode,
        private variabilityConfig: TrafficVariabilityConfig,
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
        this.state = {
            currentPhase: 'RED',
            timeRemainingInPhase: this.device.characteristics.redLightCycle,
            currentGreenPhase: null,
            lastReading: null,
            vehicleQueue: [],
            redTarget: 0,
            redArrivalAccumulator: 0,
            currentServiceModifier: 1,
            congestionLevel: 0.5,
            congestionTrend: 0,
            isActive: false,
            lastCongestionState: false
        };
    }

    public start(): void {
        if (this.state.isActive) return;
        this.state.isActive = true;
        this.startRedPhase();
        this.notifyStateUpdate();
    }

    public stop(): void {
        if (!this.state.isActive) return;
        this.state.isActive = false;
        this.notifyStateUpdate();
    }

    public processTick(deltaSeconds: number): void {
        if (!this.state.isActive) return;

        this.state.timeRemainingInPhase = Math.max(0, this.state.timeRemainingInPhase - deltaSeconds);

        if (this.state.currentPhase === 'RED') {
            this.processRedPhase(deltaSeconds);
        } else {
            this.processGreenPhase(deltaSeconds);
        }

        if (this.state.timeRemainingInPhase <= 0) {
            this.handlePhaseTransition();
        }

        this.notifyStateUpdate();
    }

    private calculateDynamicArrivalRate(deltaSeconds: number): number {
        this.state.congestionLevel += (
            this.state.congestionTrend * 
            this.variabilityConfig.dynamic.baseVolatility * 
            deltaSeconds / 60
        );

        this.state.congestionLevel = Math.max(0, Math.min(1, this.state.congestionLevel));

        const [clearMin, clearMax] = this.variabilityConfig.clear.arrivalRange;
        const [congMin, congMax] = this.variabilityConfig.congested.arrivalRange;

        const targetMin = clearMin + (congMin - clearMin) * this.state.congestionLevel;
        const targetMax = clearMax + (congMax - clearMax) * this.state.congestionLevel;

        return targetMin + Math.random() * (targetMax - targetMin);
    }

    private updateCongestionTrend(): void {
        const queueRatio = this.state.vehicleQueue.length / this.device.characteristics.averageQueue;
        const queueImpact = (queueRatio - 1) * this.variabilityConfig.dynamic.queueImpactFactor;

        const randomFactor = (Math.random() - 0.5) * 2 * this.variabilityConfig.dynamic.baseVolatility;
        const recoveryForce = (0.5 - this.state.congestionLevel) * this.variabilityConfig.dynamic.recoveryRate;

        this.state.congestionTrend = queueImpact + randomFactor + recoveryForce;
    }

 

    private processGreenPhase(deltaSeconds: number): void {
        if (!this.state.currentGreenPhase) return;

        const serviceTimeSec = this.getServiceTime() / 1000;
        const vehiclesPerSecond = 1 / serviceTimeSec;
        const departuresThisTick = vehiclesPerSecond * deltaSeconds;
        
        this.state.currentGreenPhase.departureAccumulator += departuresThisTick;
        while (
            this.state.currentGreenPhase.departureAccumulator >= 1 &&
            this.state.vehicleQueue.length > 0
        ) {
            this.state.vehicleQueue.shift();
            this.state.currentGreenPhase.vehiclesPassed++;
            this.state.currentGreenPhase.departureAccumulator -= 1;
        }
    }

    private processRedPhase(deltaSeconds: number): void {
        if (this.trafficPattern === TrafficPatternMode.DYNAMIC) {
            let congestedProb = this.variabilityConfig.dynamic.congestedProbability;
            
            // Reduced queue impact
            const queueRatio = this.state.vehicleQueue.length / this.device.characteristics.averageQueue;
            if (queueRatio > 1) {
                congestedProb = Math.min(0.85, congestedProb + (queueRatio - 1) * 0.1); // Reduced from 0.2
            }

            // Reduced congestion inertia
            if (this.state.lastCongestionState) {
                congestedProb *= 1.1; // Reduced from 1.2
            }

            const isCongested = Math.random() < congestedProb;
            
            if (this.state.lastCongestionState !== isCongested) {
                if (Math.random() > this.variabilityConfig.dynamic.inertiaFactor) {
                    this.state.lastCongestionState = isCongested;
                }
            }

            let [min, max] = this.state.lastCongestionState ? 
                this.variabilityConfig.congested.arrivalRange :
                this.variabilityConfig.clear.arrivalRange;

            let targetArrivals;
            if (this.state.lastCongestionState) {
                // Reduced bias towards upper range
                const bias = 0.2; // Reduced from 0.3
                targetArrivals = min + (max - min) * (bias + Math.random() * (1 - bias));
            } else {
                targetArrivals = min + Math.random() * (max - min);
            }

            const arrivalsPerSecond = targetArrivals / this.device.characteristics.redLightCycle;
            const arrivalsThisTick = arrivalsPerSecond * deltaSeconds;
            
            this.state.redArrivalAccumulator += arrivalsThisTick;
            
            const vehiclesToAdd = Math.floor(this.state.redArrivalAccumulator);
            for (let i = 0; i < vehiclesToAdd; i++) {
                this.state.vehicleQueue.push({ enteredAt: Date.now() });
            }
            this.state.redArrivalAccumulator -= vehiclesToAdd;

            if (this.state.lastCongestionState) {
                const baseModifier = this.variabilityConfig.congested.serviceModifier;
                this.state.currentServiceModifier = baseModifier * (1 + Math.random() * 0.2); // Reduced from 0.3
            } else {
                this.state.currentServiceModifier = this.variabilityConfig.clear.serviceModifier;
            }
        } else {
            // Original non-dynamic logic
            const arrivalsPerSecond = this.state.redTarget / this.device.characteristics.redLightCycle;
            const arrivalsThisTick = arrivalsPerSecond * deltaSeconds;
            this.state.redArrivalAccumulator += arrivalsThisTick;
            
            const vehiclesToAdd = Math.floor(this.state.redArrivalAccumulator);
            for (let i = 0; i < vehiclesToAdd; i++) {
                this.state.vehicleQueue.push({ enteredAt: Date.now() });
            }
            this.state.redArrivalAccumulator -= vehiclesToAdd;
        }
    }
    private startRedPhase(): void {
        this.state.currentPhase = 'RED';
        this.state.timeRemainingInPhase = this.device.characteristics.redLightCycle;
        this.state.currentGreenPhase = null;

        if (this.trafficPattern === TrafficPatternMode.DYNAMIC) {
            let congestedProb = this.variabilityConfig.dynamic.congestedProbability;
            
            // Increase congestion probability if queue is above average
            const queueRatio = this.state.vehicleQueue.length / this.device.characteristics.averageQueue;
            if (queueRatio > 1) {
                congestedProb = Math.min(0.95, congestedProb + (queueRatio - 1) * 0.2);
            }

            // Apply inertia
            if (this.state.lastCongestionState) {
                congestedProb *= 1.2;
            }

            const isCongested = Math.random() < congestedProb;
            
            if (this.state.lastCongestionState !== isCongested) {
                if (Math.random() > this.variabilityConfig.dynamic.inertiaFactor) {
                    this.state.lastCongestionState = isCongested;
                }
            }

            const [min, max] = this.state.lastCongestionState ? 
                this.variabilityConfig.congested.arrivalRange :
                this.variabilityConfig.clear.arrivalRange;

            // Add bias towards upper range when congested
            if (this.state.lastCongestionState) {
                const bias = 0.3;
                this.state.redTarget = Math.floor(min + (max - min) * (bias + Math.random() * (1 - bias)));
                this.state.currentServiceModifier = this.variabilityConfig.congested.serviceModifier * (1 + Math.random() * 0.3);
            } else {
                this.state.redTarget = Math.floor(min + Math.random() * (max - min));
                this.state.currentServiceModifier = this.variabilityConfig.clear.serviceModifier;
            }
        } else {
            // Original clear/congested logic remains the same
            if (this.trafficPattern === TrafficPatternMode.CLEAR) {
                const [min, max] = this.variabilityConfig.clear.arrivalRange;
                this.state.redTarget = Math.floor(Math.random() * (max - min + 1)) + min;
                this.state.currentServiceModifier = this.variabilityConfig.clear.serviceModifier;
            } else {
                const [min, max] = this.variabilityConfig.congested.arrivalRange;
                this.state.redTarget = Math.floor(Math.random() * (max - min + 1)) + min;
                this.state.currentServiceModifier = this.variabilityConfig.congested.serviceModifier;
            }
        }
        this.state.redArrivalAccumulator = 0;
    }

    private startGreenPhase(): void {
        this.state.currentPhase = 'GREEN';
        this.state.timeRemainingInPhase = this.device.characteristics.greenLightCycle;
        this.state.currentGreenPhase = {
            startTime: Date.now(),
            initialQueueSize: this.state.vehicleQueue.length,
            vehiclesPassed: 0,
            departureAccumulator: 0
        };
    }

    private handlePhaseTransition(): void {
        if (this.state.currentPhase === 'RED') {
            this.startGreenPhase();
        } else {
            this.generateReading();
            this.startRedPhase();
        }
    }
    private generateReading(): void {
        if (!this.state.currentGreenPhase) return;

        const initial = this.state.currentGreenPhase.initialQueueSize;
        const passed = this.state.currentGreenPhase.vehiclesPassed;
        const clearanceRate = initial > 0 ? (passed / initial) * 100 : 100;

        const reading: TrafficSensorReading = {
            deviceId: this.device.deviceId,
            intersectionId: this.device.intersectionId,
            timestamp: new Date().toISOString(),
            cycleMetrics: {
                queuedVehicles: initial,
                vehiclesPassed: passed,
                clearanceRate: clearanceRate,
                averageSpeed: 30 + Math.random() * 20,
                vehicleTypes: {
                    cars: Math.floor(passed * 0.7),
                    trucks: Math.floor(passed * 0.2),
                    buses: Math.floor(passed * 0.1),
                },
            },
            localConditions: {
                temperature: this.weatherConfig.temperature,
                visibility: this.weatherConfig.visibility,
                precipitation: this.weatherConfig.precipitation,
                roadSurface: this.weatherConfig.condition,
                lightLevel: this.weatherConfig.lightLevel,
            },
        };

        this.state.lastReading = reading;
        this.onReading(reading);
    }

    private getWeatherModifier(): number {
        let modifier = 1.0;
        if (this.weatherConfig.precipitation) modifier *= 0.7;
        if (this.weatherConfig.visibility < 50) modifier *= 0.8;
        if (this.weatherConfig.condition === 'icy' || this.weatherConfig.condition === 'wet') modifier *= 0.75;
        if (this.weatherConfig.condition === 'snow') modifier *= 0.6;
        if (this.weatherConfig.lightLevel < 50) modifier *= 0.85;
        return modifier;
    }

    private getServiceTime(): number {
        const base = this.BASE_PASSING_SPEED;
        const randomFactor = 0.8 + 0.4 * Math.random();
        const weatherMod = this.getWeatherModifier();
        return base * randomFactor * this.state.currentServiceModifier / weatherMod;
    }

    private notifyStateUpdate(): void {
        this.onStateUpdate(
            this.device.deviceId,
            this.state.currentPhase,
            this.state.vehicleQueue.length,
            this.state.timeRemainingInPhase,
            this.state.currentGreenPhase?.vehiclesPassed || 0,
            this.state.lastReading
        );
    }

    public getDeviceId(): string {
        return this.device.deviceId;
    }

    public isActive(): boolean {
        return this.state.isActive;
    }

    public updateWeatherConfig(config: GlobalWeatherConfig): void {
        this.weatherConfig = config;
    }

    public updateTrafficPattern(pattern: TrafficPatternMode): void {
        this.trafficPattern = pattern;
    }

    public updateVariabilityConfig(config: TrafficVariabilityConfig): void {
        this.variabilityConfig = config;
    }

    public getCongestionMetrics(): { level: number; trend: number } {
        return {
            level: this.state.congestionLevel,
            trend: this.state.congestionTrend
        };
    }
}