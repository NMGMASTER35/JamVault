import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Loader2, Wifi, RefreshCw 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from '@/lib/queryClient';

interface RemoteControlProps {
  type: 'controller' | 'player';
}

interface RemoteDevice {
  deviceId: string;
  name: string;
  currentSong?: {
    id: number;
    title: string;
    artist: string;
    duration: number;
  } | null;
  isPlaying: boolean;
  volume: number;
}

export function RemoteControl({ type }: RemoteControlProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<RemoteDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(
    type === 'player' ? 'JamVault Player' : 'JamVault Remote'
  );
  const [connectionInfo, setConnectionInfo] = useState<{
    token: string;
    host: string;
    wsPath: string;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [volume, setVolume] = useState(100);
  const [controlMessage, setControlMessage] = useState<string | null>(null);
  
  // Generate a QR code URL that can be used by another device to connect
  const qrCodeData = connectionInfo 
    ? JSON.stringify({
        host: connectionInfo.host,
        token: connectionInfo.token,
        wsPath: connectionInfo.wsPath,
        userId: user?.id
      })
    : '';

  // Get connection info from server
  const getConnectionInfo = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('GET', '/api/remote-control/info');
      const data = await response.json();
      setConnectionInfo(data);
    } catch (error) {
      toast({
        title: 'Error getting connection info',
        description: 'Could not connect to the server. Please try again.',
        variant: 'destructive'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize connection on component mount
  useEffect(() => {
    if (user) {
      getConnectionInfo();
    }
  }, [user]);

  // Connect to WebSocket when we have connection info
  useEffect(() => {
    if (!connectionInfo || !user) return;
    
    // Clean up previous connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnecting(true);
    
    // Determine the WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${connectionInfo.host}${connectionInfo.wsPath}`;

    // Create new WebSocket connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      // Send authentication
      ws.send(JSON.stringify({
        type: 'auth',
        token: connectionInfo.token,
        deviceType: type,
        deviceName: displayName
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);
        
        // Handle auth success
        if (data.type === 'auth_success') {
          setConnected(true);
          setConnecting(false);
          toast({
            title: 'Connected',
            description: data.message || `Connected as ${type}`,
          });
        }
        
        // Handle auth error
        else if (data.type === 'auth_error') {
          setConnected(false);
          setConnecting(false);
          toast({
            title: 'Connection failed',
            description: data.message || 'Authentication failed',
            variant: 'destructive'
          });
        }
        
        // Handle list of available players (controller only)
        else if (type === 'controller' && data.type === 'available_players') {
          setDevices(data.players || []);
          if (data.players && data.players.length > 0 && !selectedDevice) {
            setSelectedDevice(data.players[0].deviceId);
          }
        }
        
        // Handle player connected (controller only)
        else if (type === 'controller' && data.type === 'player_connected') {
          toast({
            title: 'Player connected',
            description: `${data.name} is now available`
          });
          
          // Add to devices if not already there
          setDevices(prev => {
            if (prev.some(d => d.deviceId === data.deviceId)) {
              return prev;
            }
            return [...prev, {
              deviceId: data.deviceId,
              name: data.name,
              isPlaying: false,
              volume: 100,
              currentSong: null
            }];
          });
          
          // Select this device if none selected
          if (!selectedDevice) {
            setSelectedDevice(data.deviceId);
          }
        }
        
        // Handle player disconnected (controller only)
        else if (type === 'controller' && data.type === 'player_disconnected') {
          toast({
            title: 'Player disconnected',
            description: 'A player has disconnected'
          });
          
          // Remove from devices
          setDevices(prev => prev.filter(d => d.deviceId !== data.deviceId));
          
          // If selected device disconnected, select another
          if (selectedDevice === data.deviceId) {
            setSelectedDevice(prev => {
              const remainingDevices = devices.filter(d => d.deviceId !== data.deviceId);
              return remainingDevices.length > 0 ? remainingDevices[0].deviceId : null;
            });
          }
        }
        
        // Handle player status update (controller only)
        else if (type === 'controller' && data.type === 'player_status') {
          // Update device info
          setDevices(prev => {
            return prev.map(d => {
              if (d.deviceId === data.deviceId) {
                return {
                  ...d,
                  currentSong: data.currentSong,
                  isPlaying: data.isPlaying,
                  volume: data.volume
                };
              }
              return d;
            });
          });
          
          // If this is the selected device, update volume
          if (selectedDevice === data.deviceId) {
            setVolume(data.volume);
          }
        }
        
        // Handle command (player only)
        else if (type === 'player' && data.type === 'command') {
          // Process commands
          setControlMessage(`Received command: ${data.action}`);
          const message = {
            action: data.action,
            params: data.params
          };
          
          // Dispatch custom event that the audio player can listen for
          window.dispatchEvent(new CustomEvent('remote-control', { 
            detail: message 
          }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
      setConnecting(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
      setConnecting(false);
      toast({
        title: 'Connection error',
        description: 'Could not connect to remote control server',
        variant: 'destructive'
      });
    };
    
    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectionInfo, type, displayName, user]);
  
  // Send remote command to player
  const sendCommand = (action: string, params?: any) => {
    if (!wsRef.current || !selectedDevice || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection error',
        description: 'Not connected to remote control server',
        variant: 'destructive'
      });
      return;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'command',
      targetDeviceId: selectedDevice,
      action,
      params
    }));
  };
  
  // Send status update (for player)
  const sendStatusUpdate = (status: {
    currentSong?: any;
    isPlaying?: boolean;
    volume?: number;
  }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    wsRef.current.send(JSON.stringify({
      type: 'status_update',
      ...status
    }));
  };
  
  // Update audio player status (for player) when song changes, play state changes, etc.
  useEffect(() => {
    if (type !== 'player' || !connected) return;
    
    // Create event listeners to get player status
    const handleSongChange = (e: CustomEvent) => {
      sendStatusUpdate({ 
        currentSong: e.detail,
        isPlaying: true
      });
    };
    
    const handlePlayStateChange = (e: CustomEvent) => {
      sendStatusUpdate({ isPlaying: e.detail.isPlaying });
    };
    
    const handleVolumeChange = (e: CustomEvent) => {
      sendStatusUpdate({ volume: e.detail.volume });
    };
    
    // Add event listeners
    window.addEventListener('audio-song-change', handleSongChange as EventListener);
    window.addEventListener('audio-play-state-change', handlePlayStateChange as EventListener);
    window.addEventListener('audio-volume-change', handleVolumeChange as EventListener);
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('audio-song-change', handleSongChange as EventListener);
      window.removeEventListener('audio-play-state-change', handlePlayStateChange as EventListener);
      window.removeEventListener('audio-volume-change', handleVolumeChange as EventListener);
    };
  }, [type, connected]);
  
  // Player component (what shows on the device playing music)
  const PlayerView = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Remote Playback Device</CardTitle>
        <CardDescription>
          {connected 
            ? 'This device can be controlled remotely' 
            : 'Connect this device to control it remotely'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading connection details...</p>
          </div>
        ) : connecting ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Connecting to remote server...</p>
          </div>
        ) : connected ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center justify-center gap-2 text-green-500">
              <Wifi className="h-6 w-6" />
              <span className="text-lg font-medium">Connected</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {controlMessage && (
                <p>Last command: {controlMessage}</p>
              )}
            </div>
            
            <div className="border rounded-lg p-4 w-full mt-4">
              <h3 className="text-lg font-medium mb-2">Scan to Control</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use another device to scan this QR code to control this player
              </p>
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <QRCodeSVG 
                  value={qrCodeData} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="displayName">Device Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Give this device a name"
              />
            </div>
            
            <Button 
              onClick={getConnectionInfo} 
              className="w-full"
              disabled={loading}
            >
              Connect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // Controller component (what shows on the remote control device)
  const ControllerView = () => {
    // Find selected device
    const device = devices.find(d => d.deviceId === selectedDevice);
    
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Remote Control</CardTitle>
          <CardDescription>
            {connected 
              ? 'Control your music from this device' 
              : 'Connect to control your music remotely'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading connection details...</p>
            </div>
          ) : connecting ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Connecting to remote server...</p>
            </div>
          ) : connected ? (
            <>
              {devices.length === 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <p>No playback devices connected</p>
                  <p className="text-sm text-muted-foreground">
                    Open JamVault on another device and enable remote control
                  </p>
                  
                  <div className="border rounded-lg p-4 w-full mt-4">
                    <h3 className="text-lg font-medium mb-2">Scan on Another Device</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Scan this QR code on another device to enable it as a player
                    </p>
                    <div className="flex justify-center bg-white p-4 rounded-lg">
                      <QRCodeSVG 
                        value={qrCodeData} 
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="device-select">Playback Device</Label>
                    <select
                      id="device-select"
                      value={selectedDevice || ''}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {devices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {device && (
                    <>
                      <div className="flex flex-col items-center gap-4 py-6">
                        <div className="text-center">
                          <h3 className="text-xl font-bold truncate max-w-[300px]">
                            {device.currentSong?.title || 'No song playing'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {device.currentSong?.artist || 'Select a song to play'}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-center gap-6 mt-4">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => sendCommand('previous')}
                            title="Previous"
                          >
                            <SkipBack className="h-6 w-6" />
                          </Button>
                          
                          <Button
                            size="icon"
                            className="h-14 w-14 rounded-full"
                            onClick={() => sendCommand(device.isPlaying ? 'pause' : 'play')}
                            title={device.isPlaying ? 'Pause' : 'Play'}
                          >
                            {device.isPlaying ? (
                              <Pause className="h-6 w-6" />
                            ) : (
                              <Play className="h-6 w-6 ml-1" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => sendCommand('next')}
                            title="Next"
                          >
                            <SkipForward className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="volume">Volume</Label>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const newVolume = volume === 0 ? 100 : 0;
                              setVolume(newVolume);
                              sendCommand('volume', { level: newVolume });
                            }}
                          >
                            {volume === 0 ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            id="volume"
                            value={[volume]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) => {
                              setVolume(value[0]);
                              sendCommand('volume', { level: value[0] });
                            }}
                          />
                          <span className="w-9 text-right">{volume}%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="controllerName">Device Name</Label>
                <Input
                  id="controllerName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Give this remote control a name"
                />
              </div>
              
              <Button 
                onClick={getConnectionInfo} 
                className="w-full"
                disabled={loading}
              >
                Connect
              </Button>
            </div>
          )}
        </CardContent>
        
        {connected && (
          <CardFooter className="flex justify-between">
            <div className="text-xs text-muted-foreground">
              {devices.length} device{devices.length !== 1 ? 's' : ''} connected
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={getConnectionInfo}
              title="Refresh connection"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  };
  
  return type === 'player' ? <PlayerView /> : <ControllerView />;
}