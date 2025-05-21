"use client"

import { GlobalWeatherConfig, RoadSurfaceCondition } from "@/services/types"
import { useSimulatorStore } from "@/stores/useSimulatorStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

export function WeatherConfig() {
    const { weatherConfig, setWeatherConfig } = useSimulatorStore()

    const updateConfig = (update: Partial<GlobalWeatherConfig>) => {
        setWeatherConfig({ ...weatherConfig, ...update })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Weather Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span>Road Condition</span>
                            <Select
                                value={weatherConfig.condition}
                                onValueChange={(value: RoadSurfaceCondition) => 
                                    updateConfig({ condition: value })}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dry">Dry</SelectItem>
                                    <SelectItem value="wet">Wet</SelectItem>
                                    <SelectItem value="icy">Icy</SelectItem>
                                    <SelectItem value="snow">Snow</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Precipitation</span>
                            <Switch
                                checked={weatherConfig.precipitation}
                                onCheckedChange={(checked) => 
                                    updateConfig({ precipitation: checked })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-8">
                        <div className="w-1/2 space-y-2">
                            <div className="flex items-center justify-between">
                                <span>Temperature (°C)</span>
                                <span>{weatherConfig.temperature}°C</span>
                            </div>
                            <Slider 
                                value={[weatherConfig.temperature]}
                                min={-10}
                                max={40}
                                step={1}
                                onValueChange={([value]) => updateConfig({ temperature: value })}
                            />
                        </div>

                        <div className="w-1/2 space-y-2">
                            <div className="flex items-center justify-between">
                                <span>Visibility (%)</span>
                                <span>{weatherConfig.visibility}%</span>
                            </div>
                            <Slider 
                                value={[weatherConfig.visibility]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={([value]) => updateConfig({ visibility: value })}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}