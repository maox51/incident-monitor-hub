import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface WebSocketMessage {
  type: 'connected' | 'new_message' | 'error' | 'user_typing';
  [key: string]: any;
}

interface UseWebSocketChatProps {
  onNewMessage?: (message: any) => void;
  onError?: (error: string) => void;
}

export const useWebSocketChat = ({ onNewMessage, onError }: UseWebSocketChatProps = {}) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    if (!user) return;

    try {
      setConnectionStatus('connecting');
      
      // Get current session token
      const session = await user.getSession();
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/functions/v1/chat-websocket?userId=${user.id}&token=${session.access_token}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('WebSocket connection confirmed');
              break;
              
            case 'new_message':
              onNewMessage?.(message.message);
              break;
              
            case 'error':
              console.error('WebSocket error:', message.message);
              onError?.(message.message);
              break;
              
            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Auto-reconnect logic
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
          reconnectAttemptsRef.current += 1;
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.log('Max reconnection attempts reached');
          onError?.('Conexión perdida. Por favor, recarga la página.');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.('Error en la conexión WebSocket');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionStatus('disconnected');
      onError?.('Error al conectar con el servidor de chat');
    }
  }, [user, onNewMessage, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    return sendMessage({
      type: 'join_room',
      roomId
    });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    return sendMessage({
      type: 'leave_room'
    });
  }, [sendMessage]);

  const sendChatMessage = useCallback((content: string, roomId: string) => {
    return sendMessage({
      type: 'send_message',
      content,
      roomId
    });
  }, [sendMessage]);

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    sendChatMessage,
  };
};