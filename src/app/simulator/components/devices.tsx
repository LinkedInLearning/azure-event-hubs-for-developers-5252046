"use client";

import { useEffect } from "react"
import { SensorRow } from "./sensor-row"
import { useSimulatorStore } from "@/stores/useSimulatorStore"
import { useSensorStore } from "@/stores/useSensorStore"
import { Button } from "@/components/ui/button"

export default function SensorDeviceList() {
    const { 
        setSensorDevices, 
        activeSimulators,
        sensorDevices,
        startSimulator,
        stopSimulator
    } = useSimulatorStore()

    const { 
        sensors, 
        isLoading, 
        error,
        fetchSensors 
    } = useSensorStore()

    useEffect(() => {
        fetchSensors()
       
    }, [fetchSensors])

    // useEffect(() => {
    //     if (sensors.length > 0) {
    //         setSensorDevices(sensors)
    //     }
    // }, [sensors, setSensorDevices])

    useEffect(() => {
    // Only set devices if we have sensors AND don't already have devices in the simulator
    if (sensors.length > 0 && sensorDevices.length === 0) {
        setSensorDevices(sensors)
    }
}, [sensors, setSensorDevices, sensorDevices.length])

    const toggleSensor = (sensorId: string) => {
        if (activeSimulators.has(sensorId)) {
            stopSimulator(sensorId)
        } else {
            startSimulator(sensorId)
        }
    }

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <p>Loading sensors...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <p className="text-red-500">Error loading sensors: {error.message}</p>
                <Button 
                    variant="outline" 
                    className="ml-4"
                    onClick={() => fetchSensors()}
                >
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center p-8 pb-4">
                <h1 className="text-2xl font-bold">Traffic Simulator</h1>
                <div className="flex gap-2">
                    <Button 
                        variant="default"
                        onClick={() => sensors?.forEach(s => startSimulator(s.deviceId))}
                        disabled={!sensors?.length}
                    >
                        Start All
                    </Button>
                    <Button 
                        variant="destructive"
                        onClick={() => sensors?.forEach(s => stopSimulator(s.deviceId))}
                        disabled={activeSimulators.size === 0}
                    >
                        Stop All
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-8">
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0">
                            <tr className="border-b bg-gray-800 text-gray-100">
                                <th className="p-2 text-left">Sensor ID</th>
                                <th className="p-2 text-left">Location</th>
                                <th className="p-2 text-left">Characteristics</th>
                                <th className="p-2 text-left">Traffic Info</th>
                                <th className="p-2 text-left">Light Status</th>
                                <th className="p-2 text-left">Simulator Status</th>
                                <th className="p-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sensors?.map((sensor) => (
                                <SensorRow
                                    key={sensor.deviceId}
                                    sensor={sensor}
                                    isActive={activeSimulators.has(sensor.deviceId)}
                                    onToggle={toggleSensor}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}