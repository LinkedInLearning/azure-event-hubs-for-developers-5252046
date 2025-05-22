'use client';
import { EventHubProducerClient, EventDataBatch } from "@azure/event-hubs";
import { TrafficSensorReading } from "./types";


class EventHubService {
    private producer: EventHubProducerClient;
    private batchMap: Map<string, EventDataBatch> = new Map();
    private sendInterval: NodeJS.Timeout | null = null;
    private readonly SEND_INTERVAL_MS = 5000; // Send batches every 5 seconds
    private readonly CONNECTION_STRING = "Endpoint=sb://trafficapp.servicebus.windows.net/;SharedAccessKeyName=sensordevices;SharedAccessKey=g6FC/bJzNqvxSSEpwSx9P9XcVel2AiItw+AEhNjauY4=;EntityPath=traffic-hub";
    private readonly EVENT_HUB_NAME = "traffic-hub";
    
     private onBatchSentCallback: ((batchSize: number, partitionKey: string) => void) | null = null;
    private onBatchErrorCallback: ((error: any, batchSize: number, partitionKey: string) => void) | null = null;
    
    private constructor() {
        this.producer = new EventHubProducerClient(this.CONNECTION_STRING, this.EVENT_HUB_NAME);
        this.startSendInterval();
    }

    private static instance: EventHubService;

    public static getInstance(): EventHubService {
        if (!EventHubService.instance) {
            EventHubService.instance = new EventHubService();
        }
        return EventHubService.instance;
    }

    /**
     * Start the interval timer to periodically send batches
     */
    private startSendInterval(): void {
        if (this.sendInterval === null) {
            this.sendInterval = setInterval(() => {
                this.sendAllBatches();
            }, this.SEND_INTERVAL_MS);
        }
    }

    setOnBatchSent(callback: (batchSize: number, partitionKey: string) => void): void {
        this.onBatchSentCallback = callback;
    }
    
   
    setOnBatchError(callback: (error: any, batchSize: number, partitionKey: string) => void): void {
        this.onBatchErrorCallback = callback;
    }
    /**
     * Queue an event to be sent in the appropriate batch
     */
    async queueEvent(data: TrafficSensorReading): Promise<void> {
       
        // Use intersectionId as the partition key
        const partitionKey = data.intersectionId;
        
        try {
            // Get or create a batch for this partition key
            let batch = this.batchMap.get(partitionKey);
            
            if (!batch) {
                batch = await this.producer.createBatch({ 
                    partitionKey: partitionKey 
                });
                this.batchMap.set(partitionKey, batch);
            }
            
            // Try to add the event to the batch
            const added = batch.tryAdd({ body: data });
            
            // If the batch is full, send it and create a new one
            if (!added) {
                await this.sendBatch(partitionKey, batch);
                
                // Create a new batch and try again
                batch = await this.producer.createBatch({ 
                    partitionKey: partitionKey 
                });
                
                const retryAdded = batch.tryAdd({ body: data });
                
                if (!retryAdded) {
                    console.error("Event too large to fit in a new batch");
                    return;
                }
                
                this.batchMap.set(partitionKey, batch);
            }
        } catch (error) {
            console.error("Error queueing event:", error);
            if (this.onBatchErrorCallback) {
            this.onBatchErrorCallback(error, 1, partitionKey);
        }
        }
    }

    /**
     * Send a specific batch by partition key
     */
    private async sendBatch(partitionKey: string, batch: EventDataBatch): Promise<void> {
        try {
            if (batch && batch.count > 0) {
                await this.producer.sendBatch(batch);
                console.log(`Sent batch with ${batch.count} events for partition key: ${partitionKey}`);
                 if (this.onBatchSentCallback) {
                    this.onBatchSentCallback(batch.count, partitionKey);
                }
            }
        } catch (error) {
            console.error(`Error sending batch for partition key ${partitionKey}:`, error);
             if (this.onBatchErrorCallback) {
                this.onBatchErrorCallback(error, batch.count, partitionKey);
            }
        }
    }

    /**
     * Send all current batches and create new ones
     */
    private async sendAllBatches(): Promise<void> {
        try {
            console.log('sending batches')
            // Store the keys to avoid modification during iteration
            const keys = Array.from(this.batchMap.keys());
            
            for (const key of keys) {
                const batch = this.batchMap.get(key);
                if (batch && batch.count > 0) {
                    await this.sendBatch(key, batch);
                    
                    // Create a new batch for this partition key
                    const newBatch = await this.producer.createBatch({ 
                        partitionKey: key 
                    });
                    this.batchMap.set(key, newBatch);
                }
            }
        } catch (error) {
            console.error("Error sending all batches:", error);
        }
    }

    /**
     * Force send all batches immediately
     */
    async flushAll(): Promise<void> {
        await this.sendAllBatches();
    }

    /**
     * Clean up resources when shutting down
     */
    async close(): Promise<void> {
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
            this.sendInterval = null;
        }
        
        // Send any remaining batches
        await this.sendAllBatches();
        
        // Close the producer
        await this.producer.close();
    }
}

// Export the singleton instance
const eventHubService = EventHubService.getInstance();
export default eventHubService;