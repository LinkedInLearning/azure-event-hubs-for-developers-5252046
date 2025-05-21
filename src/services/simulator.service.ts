'use client';
import { SensorDevice, TrafficSensorReading, GlobalWeatherConfig } from './types';
import { TrafficPatternMode, useSimulatorStore } from '@/stores/useSimulatorStore';


interface TrafficVariabilityConfig {
  // Settings for when conditions are effectively clear.
  clear: {
    arrivalRange: [number, number]; // e.g., [0, peakQueue]
    serviceModifier: number;        // e.g., 0.8 (faster departures)
  };
  // Settings for when conditions are congested.
  congested: {
    arrivalRange: [number, number]; // e.g., [averageQueue, 2 * averageQueue]
    serviceModifier: number;        // e.g., 1.3 (slower departures)
  };
  // Settings for dynamic mode, which randomly picks between clear and congested.
  dynamic: {
    clearProbability: number;       // e.g., 0.4 means 40% chance of clear behavior
    congestedProbability: number;   // e.g., 0.6 means 60% chance of congested behavior
    inertiaFactor?: number;         // Optional: if the previous cycle was one type, bias toward it.
  };
}

interface QueuedVehicle {
  enteredAt: number;
}

interface GreenPhase {
  startTime: number;
  initialQueueSize: number;      // Vehicles waiting at the start of green
  vehiclesPassed: number;        // Vehicles processed during green from that set
  departureAccumulator: number;  // Fractional accumulator for departures
}

interface SimulatorState {
  currentPhase: 'RED' | 'GREEN';
  timeRemainingInPhase: number;  // In seconds
  currentGreenPhase: GreenPhase | null;
  lastReading: TrafficSensorReading | null;
}

export class IntersectionSimulator {
  private state: SimulatorState;
  private vehicleQueue: QueuedVehicle[] = [];
  private intervalId?: NodeJS.Timeout;

  // Fixed tick interval (1 second).
  private readonly TICK_INTERVAL = 1000;

  // Base passing speed (milliseconds per vehicle under neutral conditions).
  private readonly BASE_PASSING_SPEED = 1200;

  // Speed multiplier: if > 1, each tick simulates more seconds.
  private speedMultiplier: number = 1;

  // For arrivals during the RED phase.
  private redTarget: number = 0;
  private redArrivalAccumulator: number = 0;

  // --- Dynamic variability configuration ---
  private trafficPattern: TrafficPatternMode;
  private variabilityConfig: TrafficVariabilityConfig;
  // Store the last effective condition when in dynamic mode (for inertia, if desired).
  private lastDynamicEffectiveCondition: TrafficPatternMode | null = null;
  // Holds the current service modifier for the cycle.
  private currentServiceModifier: number = 1;

  constructor(
    private device: SensorDevice,
    private weatherConfig: GlobalWeatherConfig,
    private onReading: (reading: TrafficSensorReading) => void,
    // Default to dynamic mode.
    trafficPattern: TrafficPatternMode = TrafficPatternMode.DYNAMIC,
    // Optional variability configuration; if not provided, defaults will be used.
    variabilityConfig?: TrafficVariabilityConfig
  ) {
    this.trafficPattern = trafficPattern;
    this.variabilityConfig = variabilityConfig || {
      clear: {
        arrivalRange: [0, this.device.characteristics.peakQueue],
        serviceModifier: 0.8,
      },
      congested: {
        arrivalRange: [this.device.characteristics.averageQueue, 2 * this.device.characteristics.averageQueue],
        serviceModifier: 1.3,
      },
      dynamic: {
        clearProbability: 0.4,
        congestedProbability: 0.6,
        inertiaFactor: 1.0,
      },
    };

    this.state = {
      currentPhase: 'RED',
      timeRemainingInPhase: this.device.characteristics.redLightCycle, // seconds
      currentGreenPhase: null,
      lastReading: null,
    };
  }

  // -------------------------------------------------------------
  // UTILITY FUNCTIONS
  // -------------------------------------------------------------
  private getWeatherModifier(): number {
    let modifier = 1.0;
    if (this.weatherConfig.precipitation) {
      modifier *= 0.7;
    }
    if (this.weatherConfig.visibility < 50) {
      modifier *= 0.8;
    }
    // Adjust for different road conditions:
    if (this.weatherConfig.condition === 'icy' || this.weatherConfig.condition === 'wet') {
      modifier *= 0.75;
    }
    // New branch for snow:
    if (this.weatherConfig.condition === 'snow') {
      modifier *= 0.6; // For instance, 40% slower in snowy conditions
    }
    if (this.weatherConfig.lightLevel < 50) {
      modifier *= 0.85;
    }
    return modifier;
  }
  

  // Compute service time (ms) for one vehicle.
  private getServiceTime(): number {
    const base = this.BASE_PASSING_SPEED;
    const randomFactor = 0.8 + 0.4 * Math.random(); // Random between 0.8 and 1.2
    const weatherMod = this.getWeatherModifier();
    // Apply current cycle's service modifier (set in startRedPhase).
    return base * randomFactor * this.currentServiceModifier / weatherMod;
  }

  // -------------------------------------------------------------
  // DYNAMIC TRAFFIC CONDITION SELECTION
  // -------------------------------------------------------------
  // In dynamic mode, randomly choose between CLEAR and CONGESTED based on default probabilities.
  private chooseDynamicEffectiveCondition(): TrafficPatternMode {
    // Retrieve default probabilities.
    let clearProb = this.variabilityConfig.dynamic.clearProbability;
    // Optional inertia: if the previous cycle was CLEAR, boost clear probability.
    if (this.lastDynamicEffectiveCondition === TrafficPatternMode.CLEAR) {
      clearProb *= this.variabilityConfig.dynamic.inertiaFactor || 1;
    } else if (this.lastDynamicEffectiveCondition === TrafficPatternMode.CONGESTED) {
      // Optionally bias toward remaining congested.
      clearProb *= 0.5; // Or use another factor if desired.
    }
    clearProb = Math.min(1, Math.max(0, clearProb)); // Clamp between 0 and 1.
    const rnd = Math.random();
    const effective = rnd < clearProb ? TrafficPatternMode.CLEAR : TrafficPatternMode.CONGESTED;
    this.lastDynamicEffectiveCondition = effective;
    return effective;
  }

  // -------------------------------------------------------------
  // PHASE TRANSITIONS
  // -------------------------------------------------------------
  private startRedPhase() {
    this.state.currentPhase = 'RED';
    this.state.timeRemainingInPhase = this.device.characteristics.redLightCycle; // seconds

    // Determine effective condition.
    let effectiveCondition: TrafficPatternMode;
    if (this.trafficPattern === TrafficPatternMode.DYNAMIC) {
      effectiveCondition = this.chooseDynamicEffectiveCondition();
    } else {
      effectiveCondition = this.trafficPattern;
    }

    // Set arrival target and service modifier based on the effective condition.
    if (effectiveCondition === TrafficPatternMode.CLEAR) {
      const [min, max] = this.variabilityConfig.clear.arrivalRange;
      this.redTarget = Math.floor(Math.random() * (max - min + 1)) + min;
      this.currentServiceModifier = this.variabilityConfig.clear.serviceModifier;
    } else {
      const [min, max] = this.variabilityConfig.congested.arrivalRange;
      this.redTarget = Math.floor(Math.random() * (max - min + 1)) + min;
      this.currentServiceModifier = this.variabilityConfig.congested.serviceModifier;
    }
    this.redArrivalAccumulator = 0;
  }

  private startGreenPhase() {
    this.state.currentPhase = 'GREEN';
    this.state.timeRemainingInPhase = this.device.characteristics.greenLightCycle; // seconds
    this.state.currentGreenPhase = {
      startTime: Date.now(),
      initialQueueSize: this.vehicleQueue.length,
      vehiclesPassed: 0,
      departureAccumulator: 0,
    };
  }

  // -------------------------------------------------------------
  // PROCESSING EACH TICK (1 SECOND)
  // -------------------------------------------------------------
  private processInterval() {
    // delta (in seconds) is the effective simulated time per tick.
    const delta = this.speedMultiplier;
    this.state.timeRemainingInPhase = Math.max(0, this.state.timeRemainingInPhase - delta);

    if (this.state.currentPhase === 'RED') {
      // Spread arrivals evenly over the red phase.
      const arrivalsPerSecond = this.redTarget / this.device.characteristics.redLightCycle;
      const arrivalsThisTick = arrivalsPerSecond * delta;
      this.redArrivalAccumulator += arrivalsThisTick;
      const vehiclesToAdd = Math.floor(this.redArrivalAccumulator);
      for (let i = 0; i < vehiclesToAdd; i++) {
        this.vehicleQueue.push({ enteredAt: Date.now() });
      }
      this.redArrivalAccumulator -= vehiclesToAdd;
    } else if (this.state.currentPhase === 'GREEN') {
      if (this.state.currentGreenPhase) {
        // Calculate service rate in vehicles per second.
        const serviceTimeSec = this.getServiceTime() / 1000;
        const vehiclesPerSecond = 1 / serviceTimeSec;
        const departuresThisTick = vehiclesPerSecond * delta;
        this.state.currentGreenPhase.departureAccumulator += departuresThisTick;
        while (
          this.state.currentGreenPhase.departureAccumulator >= 1 &&
          this.vehicleQueue.length > 0
        ) {
          this.vehicleQueue.shift();
          this.state.currentGreenPhase.vehiclesPassed++;
          this.state.currentGreenPhase.departureAccumulator -= 1;
        }
      }
    }

    // Check for phase transition.
    if (this.state.timeRemainingInPhase <= 0) {
      if (this.state.currentPhase === 'RED') {
        this.startGreenPhase();
      } else {
        // End of GREEN phase: generate reading.
        if (this.state.currentGreenPhase) {
          const initial = this.state.currentGreenPhase.initialQueueSize;
          const passed = this.state.currentGreenPhase.vehiclesPassed;
          const clearanceRate = initial > 0 ? (passed / initial) * 100 : 100;
          const reading: TrafficSensorReading = {
            deviceId: this.device.deviceId,
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
        this.startRedPhase();
      }
    }

    // Update simulator store.
    const store = useSimulatorStore.getState();
    store.updateSimulatorState(
      this.device.deviceId,
      this.state.currentPhase,
      this.vehicleQueue.length,
      this.state.timeRemainingInPhase,
      this.state.currentGreenPhase?.vehiclesPassed || 0,
      this.state.lastReading
    );
  }

  // -------------------------------------------------------------
  // PUBLIC API
  // -------------------------------------------------------------
  public start() {
    if (this.intervalId) return;
    this.startRedPhase();
    this.intervalId = setInterval(() => this.processInterval(), this.TICK_INTERVAL);
    const store = useSimulatorStore.getState();
    store.updateSimulatorState(
      this.device.deviceId,
      this.state.currentPhase,
      this.vehicleQueue.length,
      this.state.timeRemainingInPhase,
      this.state.currentGreenPhase?.vehiclesPassed || 0,
      this.state.lastReading
    );
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  public setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = Math.max(0.1, Math.min(10, multiplier));
  }

  public setTraficPattern(traficPatternMode: TrafficPatternMode) {
    this.trafficPattern = traficPatternMode;
    console.log('trafic pattner changed',traficPatternMode)
  }
  public updateWeatherConfig(config: GlobalWeatherConfig) {
    this.weatherConfig = config;
  }
}
