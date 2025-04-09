import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

type OfflineModeContextType = {
  isOffline: boolean;
  setOfflineMode: (value: boolean) => void;
};

export const OfflineModeContext = createContext<OfflineModeContextType | null>(null);

export function OfflineModeProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState<boolean>(
    localStorage.getItem('offlineMode') === 'true' || !navigator.onLine
  );
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast({
        title: "Back Online",
        description: "Your connection has been restored",
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "Offline Mode Enabled",
        description: "No internet connection detected",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    localStorage.setItem('offlineMode', isOffline ? 'true' : 'false');
    
    if (isOffline) {
      toast({
        title: "Offline Mode Enabled",
        description: "You can now use the app without an internet connection. Some features may be limited.",
      });
    }
  }, [isOffline, toast]);

  const setOfflineMode = (value: boolean) => {
    setIsOffline(value);
  };

  return (
    <OfflineModeContext.Provider value={{ isOffline, setOfflineMode }}>
      {children}
    </OfflineModeContext.Provider>
  );
}

export function useOfflineMode() {
  const context = useContext(OfflineModeContext);
  if (!context) {
    throw new Error('useOfflineMode must be used within an OfflineModeProvider');
  }
  return context;
}