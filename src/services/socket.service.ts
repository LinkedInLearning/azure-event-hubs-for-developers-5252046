import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { TrafficSensorReading } from '@/services/types';
import { useSensorStore } from '@/stores/useSensorStore';
function getSignalRNegotiateUrl(): string {
    return 'https://traffichub.azurewebsites.net/api';
}

type EventCallback = (data: any) => void;

export class SocketService {
    private connection: HubConnection | null = null;
    private static instance: SocketService;
    private eventCallbacks: Map<string, EventCallback[]> = new Map();

    private constructor() {
        this.connect();
    }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    private async connect() {
        // Update status to connecting
        useSensorStore.getState().updateSignalRStatus('connecting', 'Establishing connection...');
        
        try {
            // Create the connection using the specific negotiate endpoint
            this.connection = new HubConnectionBuilder()
                .withUrl(getSignalRNegotiateUrl())
                .withAutomaticReconnect([0, 1000, 5000, 10000])
                .configureLogging(LogLevel.Information)
                .build();

            // Set up connection status handlers
            this.connection.onreconnecting((error) => {
                console.log('Reconnecting to WebSocket server...', error);
                useSensorStore.getState().updateSignalRStatus('reconnecting', 
                    error ? `Reconnecting: ${error.message}` : 'Reconnecting to server...');
            });

            this.connection.onreconnected((connectionId) => {
                console.log('Reconnected to WebSocket server', connectionId);
                useSensorStore.getState().updateSignalRStatus('connected', 
                    'Connected to real-time updates');
                this.registerEventHandlers();
            });

            this.connection.onclose((error) => {
                console.log('Disconnected from WebSocket server', error);
                useSensorStore.getState().updateSignalRStatus('disconnected', 
                    error ? `Disconnected: ${error.message}` : 'Disconnected from server');
            });

            // Start the connection
            await this.connection.start();
            console.log('Connected to WebSocket server');
            useSensorStore.getState().updateSignalRStatus('connected', 'Connected to real-time updates');
            
            // Register event handlers
            this.registerEventHandlers();
            
        } catch (error: any) {
            console.error('Error connecting to WebSocket server:', error);
            useSensorStore.getState().updateSignalRStatus('disconnected', 
                `Connection failed: ${error.message || 'Unknown error'}`);
            
            // Retry connection after delay
            setTimeout(() => this.connect(), 5000);
        }
    }

    private registerEventHandlers() {
        if (!this.connection) return;
        
        // Re-register all event handlers after reconnection
        this.eventCallbacks.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                this.connection?.on(event, callback);
            });
        });
    }

    public on(event: string, callback: EventCallback) {
        if (this.connection) {
            this.connection.on(event, callback);
        }
        
        // Store the callback for reconnection
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event)?.push(callback);
    }

    public off(event: string, callback: EventCallback) {
        if (this.connection) {
            this.connection.off(event, callback);
        }
        
        // Remove the callback from our storage
        const callbacks = this.eventCallbacks.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
            if (callbacks.length === 0) {
                this.eventCallbacks.delete(event);
            }
        }
    }

    public isConnected(): boolean {
        return this.connection?.state === HubConnectionState.Connected;
    }
    public forceConnect() {
    if (this.connection) {
        this.connection = null;
    }
    
    this.eventCallbacks.clear();
    
    // Start a new connection
    this.connect();
}

    public async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
            this.eventCallbacks.clear();
            useSensorStore.getState().updateSignalRStatus('disconnected', 'Disconnected from server');
        }
    }
}