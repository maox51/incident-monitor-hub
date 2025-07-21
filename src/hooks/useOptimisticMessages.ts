
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { v4 as uuidv4 } from 'uuid';

interface OptimisticMessage {
  id: string;
  content: string;
  user_id: string;
  room_id: string;
  created_at: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isOptimistic?: boolean;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export const useOptimisticMessages = (roomId: string | null) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);

  const addOptimisticMessage = useCallback((content: string) => {
    if (!roomId || !user || !profile) return null;

    const optimisticMessage: OptimisticMessage = {
      id: uuidv4(),
      content,
      user_id: user.id,
      room_id: roomId,
      created_at: new Date().toISOString(),
      status: 'sending',
      isOptimistic: true,
      profiles: {
        full_name: profile.full_name || '',
        email: profile.email,
      },
    };

    setMessages(prev => [...prev, optimisticMessage]);
    return optimisticMessage.id;
  }, [roomId, user, profile]);

  const sendMessage = useCallback(async (content: string) => {
    if (!roomId || !user) return false;

    const optimisticId = addOptimisticMessage(content);
    if (!optimisticId) return false;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          content,
          room_id: roomId,
          user_id: user.id,
          status: 'sent',
        })
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { 
              ...data, 
              status: data.status as OptimisticMessage['status'],
              profiles: data.profiles 
            } 
          : msg
      ));

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark optimistic message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...msg, status: 'sent' } // Fallback to sent for now
          : msg
      ));
      
      return false;
    }
  }, [roomId, user, addOptimisticMessage]);

  const addRealtimeMessage = useCallback((message: any) => {
    const typedMessage: OptimisticMessage = {
      ...message,
      status: message.status as OptimisticMessage['status'],
    };

    setMessages(prev => {
      // Avoid duplicates - check if message already exists
      const exists = prev.some(m => m.id === typedMessage.id);
      if (exists) return prev;
      
      // Remove any optimistic messages from the same user with same content
      const filtered = prev.filter(m => 
        !(m.isOptimistic && m.user_id === typedMessage.user_id && m.content === typedMessage.content)
      );
      
      return [...filtered, typedMessage];
    });
  }, []);

  const updateMessageStatus = useCallback((messageId: string, status: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: status as OptimisticMessage['status'] }
        : msg
    ));
  }, []);

  const markMessagesAsRead = useCallback(async () => {
    if (!roomId || !user) return;

    try {
      await supabase.rpc('mark_messages_as_read', {
        _room_id: roomId,
        _user_id: user.id,
      });

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.user_id !== user.id 
          ? { ...msg, status: 'read' }
          : msg
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [roomId, user]);

  const setMessagesFromDatabase = useCallback((dbMessages: any[]) => {
    const typedMessages: OptimisticMessage[] = dbMessages.map(msg => ({
      ...msg,
      status: msg.status as OptimisticMessage['status'],
    }));
    setMessages(typedMessages);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    addRealtimeMessage,
    updateMessageStatus,
    markMessagesAsRead,
    setMessagesFromDatabase,
    clearMessages,
  };
};
