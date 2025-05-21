// MapMarker.tsx
'use client';

import { useEffect, useRef } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import { SensorDevice, SensorTraficStatus } from "@/services/types";
import { createSensorStatusIcon } from "./MapIcon";
import MapPopup from "./MapPopup";
import { useSensorStore } from "@/stores/useSensorStore";
import L from "leaflet";

interface MapMarkerProps {
  cluster: {
    sensors: SensorDevice[];
    worstStatus: SensorTraficStatus | null;
  };
}

export default function MapMarker({ cluster }: MapMarkerProps) {
  const { sensors, worstStatus } = cluster;
  const { selectedSensorId } = useSensorStore();
  const markerRef = useRef<L.Marker>(null);
  const map = useMap();
  
  const isSelected = (selectedSensorId && sensors.some(s => s.deviceId === selectedSensorId))||false;
  const [lat, lng] = [sensors[0].location.latitude, sensors[0].location.longitude];

  // Handle selection effects: zoom, popup, and panning
  useEffect(() => {
    if (isSelected && markerRef.current) {
      // Open the popup
      markerRef.current.openPopup();
      
      // Pan and zoom to the marker
      map.setView(
        [lat, lng],
        16, // Zoom level - adjust this value as needed (higher = closer)
        {
          animate: true,
          duration: 1 // Animation duration in seconds
        }
      );
    }
  }, [isSelected, lat, lng, map]);

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={createSensorStatusIcon(worstStatus, isSelected)}
    >
      <Popup>
        <MapPopup 
          sensors={sensors}
          worstStatus={worstStatus}
        />
      </Popup>
    </Marker>
  );
}