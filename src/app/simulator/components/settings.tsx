"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { WeatherConfig } from "./weather-config"

import { TraficPatternConfig } from "./traffic-pattern"
import { SimulationSpeedConfig } from "./simulation-speed"
export default function SimulatorSettings() {
    

    return (
        <div className="grid grid-cols-2 gap-4">
        <WeatherConfig />
        <Card>
            <CardHeader>
                <CardTitle>Other</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4">
                <TraficPatternConfig/>
                <SimulationSpeedConfig/>
                </div>
            </CardContent>
        </Card>
      
    </div>
    )
}