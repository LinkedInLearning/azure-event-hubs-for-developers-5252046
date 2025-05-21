// MapPopup.tsx
'use client';

import { SensorDevice, SensorTraficStatus } from "@/services/types";
import { useSensorStore } from "@/stores/useSensorStore";

interface MapPopupProps {
  sensors: SensorDevice[];
  worstStatus: SensorTraficStatus | null;
}

export default function MapPopup({ sensors, worstStatus }: MapPopupProps) {
  const { selectedSensorId, setSelectedSensor } = useSensorStore();

  const handleSensorClick = (deviceId: string) => {
    setSelectedSensor(selectedSensorId === deviceId ? null : deviceId);
  };

  return (
    <div className="text-sm text-gray-800 w-[300px]">
      <div className="font-bold border-b pb-2 mb-2">
        {sensors[0].location.intersectionName}
        <span className="text-gray-500 ml-2">({sensors.length} sensors)</span>
      </div>

      <div className="space-y-2">
        {sensors.map(sensor => (
          <div 
            key={sensor.deviceId}
            onClick={() => handleSensorClick(sensor.deviceId)}
            className={`
              p-2 rounded-lg cursor-pointer
              ${selectedSensorId === sensor.deviceId 
                ? 'bg-blue-100 border-blue-300 border' 
                : 'hover:bg-gray-100 border border-transparent'}
            `}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{sensor.location.direction}</span>
              {/* Show status indicators */}
              {worstStatus && (
                <div className="flex gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    worstStatus.averageClearenceRate < 70 ? 'bg-red-100 text-red-700' :
                    worstStatus.averageClearenceRate < 90 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    Avg: {worstStatus.averageClearenceRate.toFixed(1)}%
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    worstStatus.lowestClerenceRate < 70 ? 'bg-red-100 text-red-700' :
                    worstStatus.lowestClerenceRate < 90 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    Min: {worstStatus.lowestClerenceRate.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <div className="mt-1 grid grid-cols-4 gap-2 text-xs text-gray-600">
              <div>
                <span className="block text-gray-400">Avg Queue</span>
                {sensor.characteristics.averageQueue}
              </div>
              <div>
                <span className="block text-gray-400">Max Queue</span>
                {sensor.characteristics.peakQueue}
              </div>
              <div>
                <span className="block text-gray-400">Green</span>
                {sensor.characteristics.greenLightCycle}s
              </div>
              <div>
                <span className="block text-gray-400">Red</span>
                {sensor.characteristics.redLightCycle}s
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}