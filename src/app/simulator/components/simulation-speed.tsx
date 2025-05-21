"use client"

import { useSimulatorStore } from "@/stores/useSimulatorStore"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
export function SimulationSpeedConfig() {
    const { simulationSpeed, setSimulationSpeed } = useSimulatorStore()

  
    return (
       
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Simulation Speed: {simulationSpeed}x</Label>
                </div>
                <Slider
                    value={[simulationSpeed]}
                    onValueChange={([value]) => setSimulationSpeed(value)}
                    min={1}
                    max={10}
                    step={0.5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Normal Speed</span>
                    <span>10x Faster</span>
                </div>
            </div>
      
    )
}