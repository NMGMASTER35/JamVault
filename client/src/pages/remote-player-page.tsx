import { RemoteControl } from "@/components/remote/remote-control";

export default function RemotePlayerPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8 text-center">Remote Playback</h1>
      
      <div className="grid place-items-center">
        <RemoteControl type="player" />
      </div>
      
      <div className="mt-10 text-center text-sm text-muted-foreground">
        <p className="max-w-md mx-auto">
          Set up this device to be controlled remotely from your phone or another device. 
          Your music will play from this device, but you can control it from anywhere on your WiFi network.
        </p>
      </div>
    </div>
  );
}