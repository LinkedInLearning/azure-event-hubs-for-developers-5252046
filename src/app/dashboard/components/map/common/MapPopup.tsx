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

  const getEventIcon = () => (
    <svg 
      className="w-4 h-4 text-amber-500" 
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path 
        fillRule="evenodd" 
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" 
        clipRule="evenodd" 
      />
    </svg>
  );

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
            {/* Top row: Direction name and clearance rate */}
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{sensor.location.direction}</span>
              {worstStatus && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  worstStatus.avgClearanceRate < 70 ? 'bg-red-100 text-red-700' :
                  worstStatus.avgClearanceRate < 90 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {worstStatus.avgClearanceRate.toFixed(1)}% clearance
                </span>
              )}
            </div>

            {/* Event row - only show if events exist */}
            {worstStatus?.events && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-amber-50 rounded border-l-3 border-amber-400">
                {getEventIcon()}
                <span className="text-xs text-amber-800 font-medium">
                  {worstStatus.events}
                </span>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
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