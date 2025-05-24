
  
 
  export interface SensorLocation {
    latitude: number;
    longitude: number;
    intersectionType: 'major' | 'medium' | 'minor';
    intersectionName: string;
    direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
    streetCount: number;
  }
  
  export interface SensorCharacteristics {
    averageQueue: number;
    peakQueue: number;
    greenLightCycle: number;
    redLightCycle: number;
  }
  
  export interface SensorDevice {
    deviceId: string;
    intersectionId: string;
    location: SensorLocation;
    characteristics: SensorCharacteristics;
  }
  
 //Sensor readings

 export interface VehicleTypeCount {
  cars: number;
  trucks: number;
  buses: number;
}

export interface CycleMetrics {
  queuedVehicles: number;
  vehiclesPassed: number;
  clearanceRate: number;
  averageSpeed: number;
  vehicleTypes: VehicleTypeCount;
}

export  type RoadSurfaceCondition = 'dry' | 'wet' | 'icy' | 'snow';

export interface LocalConditions {
  temperature: number;         // in celsius
  visibility: number;          // in meters
  precipitation: boolean;      // true if any form of precipitation detected
  roadSurface: RoadSurfaceCondition;
  lightLevel: number;         // percentage of normal daylight
}

export interface TrafficSensorReading {
  deviceId: string;
  intersectionId: string;
  timestamp: string;        
  cycleMetrics: CycleMetrics;
  localConditions: LocalConditions;
}

export interface GlobalWeatherConfig {
  condition: RoadSurfaceCondition;
  temperature: number;
  visibility: number;
  precipitation: boolean;
  lightLevel: number;
}


export interface SensorTraficStatus {
  deviceId: string;
  timestamp: string;
  events: string;
  avgClearanceRate:number,
  weather:LocalConditions
 
}
