// SensorTable.tsx
'use client';

import { useSensorStore } from "@/stores/useSensorStore";
import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const getClearanceRateColor = (rate: number) => {
  if (rate < 70) return "text-red-500";
  if (rate < 90) return "text-yellow-500";
  return "text-green-500";
};

export default function SensorTable() {
  const { 
    sensors, 
    latestStatuses, 
    isLoading, 
    error, 
    fetchSensors,
    selectedSensorId,
    setSelectedSensor 
  } = useSensorStore();
  
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  const sortedSensorData = useMemo(() => {
    return sensors
      .map(sensor => ({
        sensor,
        status: latestStatuses.get(sensor.deviceId)
      }))
      .sort((a, b) => {
        const aRate = a.status?.avgClearanceRate ?? Infinity;
        const bRate = b.status?.avgClearanceRate ?? Infinity;
        return aRate - bRate;
      });
  }, [sensors, latestStatuses]);

  // Scroll to selected sensor
  useEffect(() => {
    if (selectedSensorId && tableRef.current) {
      const selectedRow = tableRef.current.querySelector(`[data-sensor-id="${selectedSensorId}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [selectedSensorId]);

  if (isLoading) return <div className="bg-gray-800 text-gray-100 shadow-lg rounded-lg p-4">Loading...</div>;
  if (error) return <div className="bg-gray-800 text-gray-100 shadow-lg rounded-lg p-4">{error.message}</div>;

  return (
    <div className="flex flex-col h-full bg-gray-800 text-gray-100 shadow-lg rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-2">Sensor List</h2>
      <div ref={tableRef} className="flex-1 overflow-auto">
        <table className="min-w-full border border-gray-700">
          <thead className="bg-gray-900 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-gray-300">Device ID</th>
              <th className="px-4 py-2 text-left text-gray-300">Intersection</th>
              <th className="px-4 py-2 text-left text-gray-300">Average Clearance</th>
            </tr>
          </thead>
          <AnimatePresence>
            <motion.tbody>
              {sortedSensorData.map(({ sensor, status }) => (
                <motion.tr 
                  key={sensor.deviceId}
                  data-sensor-id={sensor.deviceId}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: 1,
                    backgroundColor: selectedSensorId === sensor.deviceId ? 'rgb(55, 65, 81)' : 'transparent'
                  }}
                  exit={{ opacity: 0 }}
                  className={`
                    border-b border-gray-700 cursor-pointer
                    ${selectedSensorId === sensor.deviceId 
                      ? 'bg-gray-600' 
                      : 'hover:bg-gray-700'}
                  `}
                  onClick={() => setSelectedSensor(
                    selectedSensorId === sensor.deviceId ? null : sensor.deviceId
                  )}
                >
                  <td className="px-4 py-2">{sensor.deviceId}</td>
                  <td className="px-4 py-2">{sensor.location.intersectionName}</td>
                  <td className="px-4 py-2">
                    {status ? (
                      <motion.span 
                        className={getClearanceRateColor(status.avgClearanceRate)}
                        animate={{ scale: [1, 1.1, 1] }}
                      >
                        {status.avgClearanceRate.toFixed(1)}%
                      </motion.span>
                    ) : '-'}
                  </td>
                 
                </motion.tr>
              ))}
            </motion.tbody>
          </AnimatePresence>
        </table>
      </div>
    </div>
  );
}