"use client"

import { TrafficPatternMode, useSimulatorStore } from "@/stores/useSimulatorStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function TraficPatternConfig() {
    const { setTrafficPatternMode,trafficPatternMode } = useSimulatorStore()

  
    return (
  
                <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                        <span>Traffic Flow</span>
                        <Select
                            value={trafficPatternMode}
                            onValueChange={(value: TrafficPatternMode) => 
                                setTrafficPatternMode(value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select Pattern" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={TrafficPatternMode.DYNAMIC}>Dynamic</SelectItem>
                                <SelectItem value={TrafficPatternMode.CLEAR}>Simulate Clear Traffic</SelectItem>
                                <SelectItem value={TrafficPatternMode.CONGESTED}>Simulate Trafic Congestion</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                  
                </div>
         
    )
}