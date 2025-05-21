// Map.tsx
// Main map component that combines all map features

'use client';

import { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSensorStore } from "@/stores/useSensorStore";
import MapBounds from "./common/MapBounds";
import MapMarker from "./common/MapMarker";
import { useMapClusters } from "./common/MapCluster";

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function Map() {
  const { sensors, latestStatuses, isLoading, error, fetchSensors } = useSensorStore();
  const clusters = useMapClusters(sensors, latestStatuses);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-800 rounded-lg">
        <p className="text-gray-400">Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-800 rounded-lg">
        <p className="text-red-500">Error loading map: {error.message}</p>
      </div>
    );
  }
  
  return (
    <MapContainer 
      className="h-full w-full flex-1" 
      scrollWheelZoom 
      zoomControl
    >
      <MapBounds sensors={sensors} />
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution='&copy; OpenStreetMap contributors' 
      />
      {clusters.map((cluster, index) => (
        <MapMarker key={index} cluster={cluster} />
      ))}
    </MapContainer>
  );
}