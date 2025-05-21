"use client";

import { useSimulatorStore } from "@/stores/useSimulatorStore";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Send } from "lucide-react";

// Dynamically import ReactJson to prevent SSR issues
const ReactJson = dynamic(() => import("@microlink/react-json-view"), { ssr: false });

export default function SensorReadingsList() {
    const { readings, eventHubStatus } = useSimulatorStore();
    const readingsArray = Array.from(readings.values());

    // Format date to a readable string or return null if date is null
    const formatDate = (date: Date | null) => {
        if (!date) return null;
        return date.toLocaleTimeString();
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-8 pb-4">
                <h1 className="text-2xl font-bold">Readings</h1>
                
                {/* EventHub Status Section */}
                <div className="mt-2 mb-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-semibold">EventHub Status</h2>
                                
                                {/* Status badge */}
                                {eventHubStatus.lastErrorTime && 
                                 (new Date().getTime() - eventHubStatus.lastErrorTime.getTime() < 60000) ? (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        Error
                                    </Badge>
                                ) : eventHubStatus.lastSendTime ? (
                                    <Badge variant="success" className="flex items-center gap-1 bg-green-600">
                                        <CheckCircle className="h-3 w-3" />
                                        Connected
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Waiting
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Queued:</p>
                                    <p className="font-medium">{eventHubStatus.queuedEvents}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Sent:</p>
                                    <p className="font-medium">{eventHubStatus.sentEvents}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Failed:</p>
                                    <p className="font-medium">{eventHubStatus.failedEvents}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Last Send:</p>
                                    <p className="font-medium">{formatDate(eventHubStatus.lastSendTime) || 'Never'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground">Last Error:</p>
                                    <p className="font-medium truncate">
                                        {eventHubStatus.lastErrorMessage 
                                            ? `${formatDate(eventHubStatus.lastErrorTime)}: ${eventHubStatus.lastErrorMessage}`
                                            : 'None'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Error alert if there's a recent error */}
                            {eventHubStatus.lastErrorMessage && 
                             (new Date().getTime() - eventHubStatus.lastErrorTime.getTime() < 60000) && (
                                <Alert variant="destructive" className="mt-3">
                                    <XCircle className="h-4 w-4" />
                                    <AlertTitle>Error sending data</AlertTitle>
                                    <AlertDescription>
                                        {eventHubStatus.lastErrorMessage}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-8">
                {readingsArray.length > 0 ? (
                    <div className="space-y-2">
                        {readingsArray.map((reading, index) => (
                            <ReactJson
                                key={index}
                                src={reading}
                                theme="monokai"
                                style={{
                                    fontSize: "11px",
                                    borderRadius: "6px",
                                    padding: "8px",
                                }}
                                displayDataTypes={false}
                                displayObjectSize={false}
                                enableClipboard={false}
                                name={false}
                                collapsed={1}
                            />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                            No readings available yet. Start a simulator to see readings.
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}