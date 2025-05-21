"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { SensorDevice, TrafficSensorReading } from "@/services/types"

interface IntersectionCardProps {
    device: SensorDevice
    reading?: TrafficSensorReading
    isActive: boolean
    onToggle: (isActive: boolean) => void
}

export function IntersectionCard({ 
    device, 
    reading,
    isActive,
    onToggle 
}: IntersectionCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {device.location.intersectionName}
                </CardTitle>
                <Switch
                    checked={isActive}
                    onCheckedChange={onToggle}
                />
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm">Status</span>
                        <Badge 
                            variant={isActive ? "default" : "secondary"}
                        >
                            {isActive ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                    {reading && (
                        <>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Queued Vehicles</span>
                                <span className="font-semibold">
                                    {reading.cycleMetrics.queuedVehicles}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Vehicles Passed</span>
                                <span className="font-semibold">
                                    {reading.cycleMetrics.vehiclesPassed}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Average Speed</span>
                                <span className="font-semibold">
                                    {reading.cycleMetrics.averageSpeed.toFixed(1)} km/h
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Road Condition</span>
                                <span className="font-semibold">
                                    {reading.localConditions.roadSurface}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}