
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export const useTypingIndicator = (roomId: string | null) => {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const roomChannel = supabase.channel(`typing_${roomId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const users: TypingUser[] = [];
        
        Object.keys(state).forEach((userId) => {
          const presence = state[userId][0];
          if (presence?.typing && presence.userId !== user.id) {
            users.push({
              userId: presence.userId,
              userName: presence.userName,
              timestamp: presence.timestamp,
            });
          }
        });
        
        setTypingUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined typing channel:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left typing channel:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Typing channel subscribed for room:', roomId);
        }
      });

    setChannel(roomChannel);

    return () => {
      roomChannel.unsubscribe();
    };
  }, [roomId, user]);

  const startTyping = useCallback(() => {
    if (!channel || !user || !profile) return;

    channel.track({
      userId: user.id,
      userName: profile.full_name || profile.email,
      typing: true,
      timestamp: Date.now(),
    });
  }, [channel, user, profile]);

  const stopTyping = useCallback(() => {
    if (!channel || !user || !profile) return;

    channel.track({
      userId: user.id,
      userName: profile.full_name || profile.email,
      typing: false,
      timestamp: Date.now(),
    });
  }, [channel, user, profile]);

  // Auto-stop typing after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      stopTyping();
    }, 3000);

    return () => clearTimeout(timer);
  }, [stopTyping]);

  return {
    typingUsers: typingUsers.filter(u => Date.now() - u.timestamp < 5000), // Only show recent typing
    startTyping,
    stopTyping,
  };
};
