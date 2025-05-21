// components/SignalRStatusIndicator.tsx
"use client";
import { useSensorStore } from '@/stores/useSensorStore';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { SocketService } from '@/services/socket.service';
export default function SignalRStatusIndicator() {
  const { signalRStatus, signalRMessage } = useSensorStore();
  
  // Status icon mapping
  const statusIcon = {
    'connected': <Wifi className="h-4 w-4 text-green-500" />,
    'connecting': <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
    'reconnecting': <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />,
    'disconnected': <WifiOff className="h-4 w-4 text-red-500" />
  };
  
  // Status color mapping
  const statusColor = {
    'connected': 'bg-green-500/20 border-green-500/50',
    'connecting': 'bg-blue-500/20 border-blue-500/50',
    'reconnecting': 'bg-yellow-500/20 border-yellow-500/50',
    'disconnected': 'bg-red-500/20 border-red-500/50'
  };

  const handleReconnect = () => {
    // Get the socket service and force a new connection
    const socketService = SocketService.getInstance();
    
    // First disconnect explicitly
    socketService.disconnect();
    
    // Then force a new connection (we'll need to add this method to SocketService)
    socketService.forceConnect();
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-2 text-sm py-1 px-3 rounded-full border ${statusColor[signalRStatus]}`}>
        {statusIcon[signalRStatus]}
        <span className="font-medium">
          {signalRStatus === 'connected' ? 'Live Data' : signalRStatus.charAt(0).toUpperCase() + signalRStatus.slice(1)}
        </span>
        {signalRMessage && (
          <span className="text-xs opacity-80 hidden sm:inline">
            - {signalRMessage}
          </span>
        )}
      </div>
      
      {signalRStatus === 'disconnected' && (
        <button 
          onClick={handleReconnect}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded-full transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Reconnect
        </button>
      )}
    </div>
  );
}