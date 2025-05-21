// pages/LiveMetricsPage.tsx
"use client";
import SensorTable from "./SensorTable";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import dynamic from 'next/dynamic';
import SignalRStatusIndicator from './components/SignalRStatusIndicator'; 

const SensorMap = dynamic(() => import("./components/map/SensorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-gray-800 rounded-lg">
      <p className="text-gray-400">Loading map...</p>
    </div>
  ),
});

export default function LiveMetricsPage() {
  
  return (
    <div className="h-full w-full flex flex-col p-2 dark:bg-gray-900 dark:text-gray-100">
       <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-semibold">Live Traffic Metrics</h1>
        <SignalRStatusIndicator />
      </div>
      
      <ResizablePanelGroup 
        direction="horizontal" 
        className="flex-1 border border-gray-700 rounded-lg overflow-hidden"
      >
        <ResizablePanel defaultSize={50} minSize={10} className="flex flex-col h-full p-4">
          <SensorMap />
        </ResizablePanel>

        <ResizableHandle className="w-2 bg-gray-600 hover:bg-gray-400 transition" />

        <ResizablePanel defaultSize={50} minSize={10} className="flex flex-col h-full p-4">
          <SensorTable />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}