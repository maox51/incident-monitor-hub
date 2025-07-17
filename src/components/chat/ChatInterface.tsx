
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Users, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ChatRoom {
  id: string;
  name: string;
  is_group: boolean;
  created_at: string;
  last_message?: {
    content: string;
    created_at: string;
    user_name: string;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

const ChatInterface = () => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadChatRooms();
      loadUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom);
      subscribeToMessages(selectedRoom);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatRooms = async () => {
    try {
      console.log('Loading chat rooms for user:', user?.id);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants!inner(user_id)
        `)
        .eq('chat_participants.user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading chat rooms:', error);
        throw error;
      }

      console.log('Chat rooms loaded:', data);
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      toast.error('Error al cargar las salas de chat');
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .neq('id', user?.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      console.log('Loading messages for room:', roomId);
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        throw error;
      }

      console.log('Messages loaded:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar los mensajes');
    }
  };

  const subscribeToMessages = (roomId: string) => {
    console.log('Subscribing to messages for room:', roomId);
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from room:', roomId);
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      console.log('Sending message:', newMessage, 'to room:', selectedRoom);
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedRoom,
          user_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    }
  };

  const createPrivateChat = async (otherUserId: string) => {
    if (!user) return;

    try {
      console.log('Creating private chat with user:', otherUserId);
      const { data, error } = await supabase
        .rpc('create_private_chat', {
          _user1_id: user.id,
          _user2_id: otherUserId
        });

      if (error) {
        console.error('Error creating private chat:', error);
        throw error;
      }

      console.log('Private chat created:', data);
      setSelectedRoom(data);
      setShowNewChat(false);
      loadChatRooms();
      toast.success('Chat creado exitosamente');
    } catch (error) {
      console.error('Error creating private chat:', error);
      toast.error('Error al crear el chat');
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar - Chat Rooms */}
      <div className="w-80 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensajes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewChat(!showNewChat)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {showNewChat && (
            <div className="space-y-3 mb-4 p-3 bg-muted rounded-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-1">
                  {filteredUsers.map(u => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer"
                      onClick={() => createPrivateChat(u.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {u.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.full_name || 'Usuario'}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {rooms.map(room => (
              <div
                key={room.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedRoom === room.id ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={() => setSelectedRoom(room.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {room.is_group ? <Users className="h-5 w-5" /> : room.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{room.name}</p>
                    {room.last_message && (
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(room.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  {room.last_message && (
                    <p className="text-xs text-muted-foreground truncate">
                      {room.last_message.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {selectedRoomData?.is_group ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      selectedRoomData?.name.split(' ').map(n => n[0]).join('')
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{selectedRoomData?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoomData?.is_group ? 'Grupo' : 'Chat privado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.user_id !== user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {message.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${message.user_id === user?.id ? 'order-first' : ''}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.user_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                    {message.user_id === user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          Tú
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Selecciona un chat</h3>
              <p className="text-muted-foreground">Elige una conversación para comenzar a chatear</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
