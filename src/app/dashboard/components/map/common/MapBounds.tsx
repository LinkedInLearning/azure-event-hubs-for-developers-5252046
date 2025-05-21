

'use client';

import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import { SensorDevice } from "@/services/types";
import type { LatLngBoundsExpression } from "leaflet";

interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function calculateBoundingBox(sensors: SensorDevice[]): BoundingBox | null {
  if (!sensors.length) return null;

  const lats = sensors.map(s => s.location.latitude);
  const lngs = sensors.map(s => s.location.longitude);

  return {
    minLat: Math.min(...lats) - 0.005,
    maxLat: Math.max(...lats) + 0.005,
    minLng: Math.min(...lngs) - 0.005,
    maxLng: Math.max(...lngs) + 0.005,
  };
}

interface MapBoundsProps {
  sensors: SensorDevice[];
}

export default function MapBounds({ sensors }: MapBoundsProps) {
  const map = useMap();
  const bounds = useMemo(() => calculateBoundingBox(sensors), [sensors]);

  useEffect(() => {
    if (bounds) {
      const leafletBounds: LatLngBoundsExpression = [
        [bounds.minLat, bounds.minLng],
        [bounds.maxLat, bounds.maxLng],
      ];
      map.fitBounds(leafletBounds);
    }
  }, [bounds, map]);

  return null;
}