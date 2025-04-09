import { RemoteControl } from "@/components/remote/remote-control";

export default function RemoteControlPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-8 text-center">Remote Control</h1>
      
      <div className="grid place-items-center">
        <RemoteControl type="controller" />
      </div>
      
      <div className="mt-10 text-center text-sm text-muted-foreground">
        <p className="max-w-md mx-auto">
          Control your JamVault music from this device. The music will play from another 
          connected device, but you can control playback from here.
        </p>
      </div>
    </div>
  );
}