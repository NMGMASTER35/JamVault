import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Check if offline mode is enabled
function isOfflineMode(): boolean {
  return localStorage.getItem('offlineMode') === 'true';
}

// Get cached response data from local storage
function getCachedData(key: string): any {
  try {
    const cachedData = localStorage.getItem(`cache_${key}`);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (err) {
    console.error('Error reading from cache:', err);
    return null;
  }
}

// Store response data in local storage
function setCachedData(key: string, data: any): void {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('Error writing to cache:', err);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // If offline and GET request, return cached data (if exists)
  if (isOfflineMode() && method === 'GET') {
    const cachedData = getCachedData(url);
    if (cachedData) {
      // Create a Response object from cached data
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Cache successful GET responses
    if (method === 'GET') {
      try {
        const clonedRes = res.clone();
        const responseData = await clonedRes.json();
        setCachedData(url, responseData);
      } catch (err) {
        console.error('Error caching response:', err);
      }
    }
    
    return res;
  } catch (err) {
    // In offline mode, use cached data if available
    if (isOfflineMode()) {
      const cachedData = getCachedData(url);
      if (cachedData) {
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Check if offline mode is enabled and return cached data if available
    if (isOfflineMode()) {
      const cachedData = getCachedData(url);
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Cache the response data
      setCachedData(url, data);
      
      return data;
    } catch (err) {
      // If offline, we already checked for cached data above
      // So if we get here, we truly have no data
      if (isOfflineMode()) {
        console.warn(`No cached data available for ${url} in offline mode`);
        return null;
      }
      throw err;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
