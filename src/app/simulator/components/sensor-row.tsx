"use client";

import { SensorDevice } from "@/services/types";
import { Switch } from "@/components/ui/switch";
import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { cn } from "@/lib/utils";
import { CarIcon, Clock, ArrowUp, Car, TimerReset, Timer } from "lucide-react";

interface SensorRowProps {
  sensor: SensorDevice;
  isActive: boolean;
  onToggle: (sensorId: string) => void;
}

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function SensorRow({ sensor, isActive, onToggle }: SensorRowProps) {
  const simulatorState = useSimulatorStore((state) =>
    state.simulatorStates.get(sensor.deviceId)
  );

  return (
    <tr className="border-t border-gray-700">
      <td className="p-2">{sensor.deviceId}</td>
      <td className="p-2">{sensor.location.intersectionName}</td>

      {/* Characteristics with icons */}
      <td className="p-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-xs">
            <CarIcon size={14} className="text-blue-400" />
            <div>
              <div className="text-gray-400">Avg Queue</div>
              <div className="font-medium">
                {sensor.characteristics.averageQueue}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ArrowUp size={14} className="text-purple-400" />
            <div>
              <div className="text-gray-400">Peak</div>
              <div className="font-medium">
                {sensor.characteristics.peakQueue}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Timer size={14} className="text-green-400" />
            <div>
              <div className="text-gray-400">Green Time</div>
              <div className="font-medium">
                {sensor.characteristics.greenLightCycle}s
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Timer size={14} className="text-red-400" />
            <div>
              <div className="text-gray-400">Red Time</div>
              <div className="font-medium">
                {sensor.characteristics.redLightCycle}s
              </div>
            </div>
          </div>
        </div>
      </td>

{/* Live Traffic Information */}
<td className="p-2">
    <div className="grid grid-cols-2 gap-4">
        {/* Current Traffic Column */}
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <CarIcon size={14} />
                <span>Queue Status</span>
            </div>
            <div className="space-y-1">
                <div className="text-red-400 font-medium text-sm">
                    {simulatorState?.queueSize || 0} waiting
                </div>
                {simulatorState?.currentPhase === "GREEN" && (
                    <div className="text-green-400 font-medium text-sm">
                        {simulatorState.vehiclesPassed} passed
                    </div>
                )}
            </div>
        </div>

        {/* Last Cycle Column */}
        <div className="border-l border-gray-700 pl-4">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <TimerReset size={14} />
                <span>Last Cycle</span>
            </div>
            {simulatorState?.lastReading ? (
                <div className="space-y-1 text-xs">
                    <div>
                        <span className="text-gray-400">Queue: </span>
                        <span className="font-medium">
                            {simulatorState.lastReading.cycleMetrics.queuedVehicles}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Passed: </span>
                        <span className="font-medium">
                            {simulatorState.lastReading.cycleMetrics.vehiclesPassed}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Clear Rate: </span>
                        <span className="font-medium">
                            {simulatorState.lastReading.cycleMetrics.clearanceRate.toFixed(1)}%
                        </span>
                    </div>
                </div>
            ) : (
                <div className="text-xs text-gray-500 italic">
                    No cycle completed
                </div>
            )}
        </div>
    </div>
</td>
      {/* Traffic Light Status with Timer */}
      <td className="p-2">
        <div
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2",
            simulatorState?.currentPhase === "GREEN"
              ? "bg-green-500/20 text-green-500"
              : "bg-red-500/20 text-red-500"
          )}
        >
          <Clock size={14} />
          <span>{simulatorState?.currentPhase || "-"}</span>
          {simulatorState?.timeRemainingInPhase !== undefined && (
            <span className="text-xs">
              ({formatTime(simulatorState.timeRemainingInPhase)})
            </span>
          )}
        </div>
      </td>

      {/* Simulator Status */}
      <td className="p-2">
        <span
          className={cn(
            "px-2 py-1 rounded-full text-sm",
            isActive
              ? "bg-green-500/20 text-green-500"
              : "bg-gray-500/20 text-gray-500"
          )}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>

      {/* Actions */}
      <td className="p-2">
        <Switch
          checked={isActive}
          onCheckedChange={() => onToggle(sensor.deviceId)}
        />
      </td>
    </tr>
  );
}
