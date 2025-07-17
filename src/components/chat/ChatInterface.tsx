import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Users, Search, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatRoom {
  id: string;
  name: string;
  is_group: boolean;
  created_at: string;
  created_by: string;
}

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  room_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
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
      
      // Primero obtener los IDs de las salas del usuario
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user?.id);

      if (participantError) {
        console.error('Error loading participant data:', participantError);
        throw participantError;
      }

      if (!participantData || participantData.length === 0) {
        setRooms([]);
        return;
      }

      const roomIds = participantData.map(p => p.room_id);

      // Luego obtener las salas
      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds);

      if (roomsError) {
        console.error('Error loading rooms:', roomsError);
        throw roomsError;
      }

      console.log('Chat rooms loaded:', roomsData);
      setRooms(roomsData || []);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      toast.error('Error al cargar las salas de chat');
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
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
      
      // First get messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        throw messagesError;
      }

      // Then get user profiles for each unique user_id
      const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        throw profilesError;
      }

      // Combine messages with profile data
      const messagesWithProfiles = messagesData?.map(message => ({
        ...message,
        profiles: profilesData?.find(p => p.id === message.user_id)
      })) || [];

      console.log('Messages loaded:', messagesWithProfiles);
      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar los mensajes');
    }
  };

  const subscribeToMessages = (roomId: string) => {
    const channel = supabase
      .channel(`messages-${roomId}`)
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
          
          // Get the user profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: ChatMessage = {
            id: payload.new.id,
            content: payload.new.content,
            user_id: payload.new.user_id,
            room_id: payload.new.room_id,
            created_at: payload.new.created_at,
            profiles: profile || undefined
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: newMessage.trim(),
          room_id: selectedRoom,
          user_id: user.id,
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    }
  };

  const createPrivateChat = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase.rpc('create_private_chat', {
        _user1_id: user?.id,
        _user2_id: otherUserId,
      });

      if (error) throw error;

      setSelectedRoom(data);
      setShowNewChat(false);
      loadChatRooms();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Error al crear el chat');
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRoomData = rooms.find(room => room.id === selectedRoom);

  return (
    <div className="h-full flex">
      {/* Sidebar con lista de chats */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chats</h2>
            <Button
              size="sm"
              onClick={() => setShowNewChat(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Chat
            </Button>
          </div>
          
          <div className="space-y-2">
            {rooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tienes chats activos</p>
                <p className="text-xs">Inicia una conversación</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRoom === room.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRoom(room.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-200 p-2 rounded-full">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{room.name}</p>
                      <p className="text-xs opacity-70">
                        {format(new Date(room.created_at), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Área principal de chat */}
      <div className="flex-1 flex flex-col">
        {selectedRoom ? (
          <>
            {/* Header del chat */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedRoomData?.name}</h3>
                  <p className="text-sm text-gray-500">
                    Chat {selectedRoomData?.is_group ? 'grupal' : 'privado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.user_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.user_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100'
                      }`}
                    >
                      {message.user_id !== user?.id && (
                        <p className="text-xs font-medium mb-1">
                          {message.profiles?.full_name || message.profiles?.email}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(message.created_at), 'HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input para nuevo mensaje */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="sm" className="gap-2">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecciona un chat
              </h3>
              <p className="text-gray-500">
                Elige una conversación existente o inicia una nueva
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialog para nuevo chat */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => createPrivateChat(user.id)}
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    No se encontraron usuarios
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInterface;