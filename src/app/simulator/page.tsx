"use client"

import dynamic from "next/dynamic"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

// Only dynamically import your custom components
const SimulatorSettings = dynamic(() => import("./components/settings"), { ssr: false })
const SensorDeviceList = dynamic(() => import("./components/devices"), { ssr: false })
const SensorReadingsList = dynamic(() => import("./components/readings"), { ssr: false })

export default function SimulatorPage() {
    return (
        <div className="h-full w-full flex flex-col">
            <ResizablePanelGroup 
                direction="horizontal" 
                className="flex-1"
            >
                <ResizablePanel defaultSize={70} minSize={20}>
                    <div className="h-full overflow-hidden flex flex-col">
                        {/* Settings at the top of left panel */}
                        <div className="flex-shrink-0">
                            <SimulatorSettings />
                        </div>
                        
                        {/* Device list takes remaining height */}
                        <div className="flex-1 overflow-hidden">
                            <SensorDeviceList />
                        </div>
                    </div>
                </ResizablePanel>

                <ResizableHandle className="w-2 transition" />

                <ResizablePanel defaultSize={30} minSize={30}>
                    <div className="h-full overflow-hidden">
                        <SensorReadingsList />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}