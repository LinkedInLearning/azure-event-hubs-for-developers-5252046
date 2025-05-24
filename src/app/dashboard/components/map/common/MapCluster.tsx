

'use client';

import { useMemo } from "react";
import { SensorDevice, SensorTraficStatus } from "@/services/types";

interface SensorCluster {
  sensors: SensorDevice[];
  worstStatus: SensorTraficStatus | null;
}

export function useMapClusters(
  sensors: SensorDevice[], 
  statuses: Map<string, SensorTraficStatus>
) {
  return useMemo(() => {
    const clusters = new Map<string, SensorCluster>();

    // Group sensors by location
    sensors.forEach(sensor => {
      const key = `${sensor.location.latitude.toFixed(5)},${sensor.location.longitude.toFixed(5)}`;
      const sensorStatus = statuses.get(sensor.deviceId);

      if (!clusters.has(key)) {
        clusters.set(key, { 
          sensors: [], 
          worstStatus: sensorStatus || null 
        });
      }

      const cluster = clusters.get(key);
      if (cluster) {
        cluster.sensors.push(sensor);

        // Update cluster's worst status
        if (sensorStatus && (!cluster.worstStatus || 
            sensorStatus.avgClearanceRate < cluster.worstStatus.avgClearanceRate)) {
          cluster.worstStatus = sensorStatus;
        }
      }
    });

    return Array.from(clusters.values());
  }, [sensors, statuses]);
}