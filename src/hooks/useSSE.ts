import { useCallback, useRef, useState } from 'react';

interface ProgressEvent {
  stage: 'started' | 'fetching-exercises' | 'generating' | 'validating' | 'storing' | 'complete';
  message: string;
  progress: number;
  estimatedTimeRemaining?: number;
  error?: string;
}

interface UseSSEOptions {
  onProgress?: (event: ProgressEvent) => void;
  onResult?: (data: any) => void;
  onError?: (error: string, code?: string) => void;
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const connect = useCallback(async (body: any) => {
    // Reset state
    setError(null);
    setIsConnected(false);

    try {
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Make the initial POST request to start the SSE stream
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if the response is SSE
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/event-stream')) {
        throw new Error('Server did not return event stream');
      }

      // Read the response as a stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      setIsConnected(true);

      const decoder = new TextDecoder();
      let buffer = '';

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Split by double newline to get complete events
        const events = buffer.split('\n\n');
        
        // Keep the last incomplete event in the buffer
        buffer = events.pop() || '';

        for (const event of events) {
          if (event.trim() === '') continue;
          
          // Parse SSE format
          const lines = event.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // Handle different event types
                if (data.type === 'result') {
                  options.onResult?.(data.data);
                } else if (data.error) {
                  options.onError?.(data.message || 'An error occurred', data.error);
                  setError(data.message || 'An error occurred');
                } else {
                  // Progress event
                  options.onProgress?.(data);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('SSE connection cancelled');
      } else {
        const errorMessage = err.message || 'Failed to connect to server';
        setError(errorMessage);
        options.onError?.(errorMessage);
      }
    } finally {
      setIsConnected(false);
    }
  }, [url, options]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  return {
    connect,
    disconnect,
    isConnected,
    error,
  };
} 