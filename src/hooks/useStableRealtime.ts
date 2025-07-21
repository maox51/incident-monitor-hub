
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RealtimeMessage {
  id: string;
  content: string;
  user_id: string;
  room_id: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface UseStableRealtimeProps {
  roomId: string | null;
  onNewMessage?: (message: RealtimeMessage) => void;
  onMessageStatusUpdate?: (messageId: string, status: string) => void;
}

export const useStableRealtime = ({ 
  roomId, 
  onNewMessage, 
  onMessageStatusUpdate 
}: UseStableRealtimeProps) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(async () => {
    if (!roomId || !user) return;

    cleanup();

    try {
      console.log('Setting up realtime channel for room:', roomId);
      
      const channel = supabase
        .channel(`room_${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomId}`,
          },
          async (payload) => {
            console.log('New message received:', payload);
            
            // Get user profile for the new message
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', payload.new.user_id)
              .single();

            const messageWithProfile: RealtimeMessage = {
              ...payload.new as RealtimeMessage,
              profiles: profile
            };

            onNewMessage?.(messageWithProfile);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomId}`,
          },
          (payload) => {
            console.log('Message status updated:', payload);
            onMessageStatusUpdate?.(payload.new.id, payload.new.status);
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setReconnectAttempts(0);
            console.log('Successfully connected to realtime');
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            console.error('Realtime channel error');
            scheduleReconnect();
          } else if (status === 'TIMED_OUT') {
            setIsConnected(false);
            console.error('Realtime connection timed out');
            scheduleReconnect();
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Error setting up realtime connection:', error);
      scheduleReconnect();
    }
  }, [roomId, user, onNewMessage, onMessageStatusUpdate, cleanup]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 10000); // Exponential backoff, max 10s
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts + 1})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connect();
    }, delay);
  }, [reconnectAttempts, connect]);

  // Handle visibility change for reconnection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && roomId) {
        console.log('Page became visible, attempting reconnect...');
        setReconnectAttempts(0);
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, roomId, connect]);

  // Initial connection and cleanup
  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    connect();
  }, [connect]);

  return {
    isConnected,
    reconnect,
    reconnectAttempts,
  };
};
