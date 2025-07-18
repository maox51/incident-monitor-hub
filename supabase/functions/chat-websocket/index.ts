import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebSocketConnection {
  socket: WebSocket;
  userId: string;
  roomId?: string;
}

const connections = new Map<string, WebSocketConnection>();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  const token = url.searchParams.get('token');

  if (!userId || !token) {
    return new Response("Missing userId or token", { status: 400 });
  }

  // Create Supabase client for database operations
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Simple validation - for now, just check if userId exists in profiles
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return new Response("User not found", { status: 404 });
    }
  } catch (error) {
    console.error('Error validating user:', error);
    return new Response("Validation error", { status: 500 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const connection: WebSocketConnection = {
    socket,
    userId,
  };

  connections.set(userId, connection);

  socket.onopen = () => {
    console.log(`WebSocket connection opened for user: ${userId}`);
    socket.send(JSON.stringify({
      type: 'connected',
      userId,
      timestamp: new Date().toISOString()
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'join_room':
          connection.roomId = message.roomId;
          console.log(`User ${userId} joined room ${message.roomId}`);
          break;
          
        case 'leave_room':
          connection.roomId = undefined;
          console.log(`User ${userId} left room`);
          break;
          
        case 'send_message':
          await handleSendMessage(message, userId, supabase);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Error processing message'
      }));
    }
  };

  socket.onclose = () => {
    console.log(`WebSocket connection closed for user: ${userId}`);
    connections.delete(userId);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    connections.delete(userId);
  };

  return response;
});

async function handleSendMessage(message: any, userId: string, supabase: any) {
  try {
    // Insert message into database
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        content: message.content,
        room_id: message.roomId,
        user_id: userId,
      })
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error saving message:', error);
      return;
    }

    // Get room participants
    const { data: participants } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('room_id', message.roomId);

    if (!participants) return;

    // Send message to all participants via WebSocket
    for (const participant of participants) {
      const connection = connections.get(participant.user_id);
      if (connection && connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(JSON.stringify({
          type: 'new_message',
          message: newMessage,
          timestamp: new Date().toISOString()
        }));
      }
    }

    // Send push notifications to offline users
    await sendPushNotifications(participants, newMessage, userId, supabase);
    
  } catch (error) {
    console.error('Error handling send message:', error);
  }
}

async function sendPushNotifications(participants: any[], message: any, senderId: string, supabase: any) {
  try {
    const offlineParticipants = participants
      .filter(p => p.user_id !== senderId && !connections.has(p.user_id))
      .map(p => p.user_id);

    if (offlineParticipants.length === 0) return;

    // Get FCM tokens for offline users
    const { data: tokens } = await supabase
      .from('fcm_tokens')
      .select('token, user_id')
      .in('user_id', offlineParticipants);

    if (!tokens || tokens.length === 0) return;

    // Send push notification via Firebase
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registration_ids: tokens.map(t => t.token),
        notification: {
          title: message.profiles?.full_name || 'Nuevo mensaje',
          body: message.content.length > 50 
            ? message.content.substring(0, 50) + '...' 
            : message.content,
          icon: '/favicon.ico',
          click_action: `${Deno.env.get('SITE_URL')}/dashboard?tab=chat`,
        },
        data: {
          type: 'chat_message',
          roomId: message.room_id,
          messageId: message.id,
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to send push notification:', await response.text());
    }
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}