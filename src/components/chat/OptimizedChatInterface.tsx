
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStableRealtime } from '@/hooks/useStableRealtime';
import { useOptimisticMessages } from '@/hooks/useOptimisticMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Users, Search, Plus, Wifi, WifiOff, Bell, BellOff, Check, CheckCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatRoom {
  id: string;
  name: string;
  is_group: boolean;
  created_at: string;
  created_by: string;
  description?: string;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

const OptimizedChatInterface = () => {
  const { user, profile } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Custom hooks
  const {
    messages,
    sendMessage,
    addRealtimeMessage,
    updateMessageStatus,
    markMessagesAsRead,
    setMessagesFromDatabase,
    clearMessages,
  } = useOptimisticMessages(selectedRoom);

  const { isConnected, reconnect } = useStableRealtime({
    roomId: selectedRoom,
    onNewMessage: addRealtimeMessage,
    onMessageStatusUpdate: updateMessageStatus,
  });

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(selectedRoom);

  const {
    isSupported: notificationsSupported,
    permission: notificationPermission,
    requestNotificationPermission,
  } = usePushNotifications();

  useEffect(() => {
    if (user) {
      loadChatRooms();
      loadUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom);
      markMessagesAsRead();
    } else {
      clearMessages();
    }
  }, [selectedRoom, clearMessages, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatRooms = async () => {
    try {
      console.log('Loading chat rooms for user:', user?.id);
      
      const { data: participantData, error: participantError } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user?.id);

      if (participantError) throw participantError;

      if (!participantData || participantData.length === 0) {
        setRooms([]);
        return;
      }

      const roomIds = participantData.map(p => p.room_id);

      const { data: roomsData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds)
        .order('updated_at', { ascending: false });

      if (roomsError) throw roomsError;

      console.log('Chat rooms loaded:', roomsData);
      setRooms(roomsData || []);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      toast.error('Error al cargar las salas de chat');
    }
  };

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .neq('id', user?.id);

      if (profile?.role !== 'admin') {
        const allowedRoles: ("admin" | "monitor" | "supervisor_monitoreo" | "rrhh" | "supervisor_salas" | "finanzas")[] = 
          ['admin', 'supervisor_monitoreo', 'monitor'];
        query = query.in('role', allowedRoles);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      console.log('Loading messages for room:', roomId);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          user_id,
          room_id,
          created_at,
          status,
          profiles!inner (
            full_name,
            email
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      console.log('Messages loaded:', messagesData);
      setMessagesFromDatabase(messagesData || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar los mensajes');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    const content = newMessage.trim();
    setNewMessage('');
    stopTyping();

    const success = await sendMessage(content);
    if (!success) {
      toast.error('Error al enviar el mensaje');
      setNewMessage(content); // Restore message on error
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
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
      await loadChatRooms();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Error al crear el chat');
    }
  };

  const createGroupChat = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error('Ingresa un nombre y selecciona al menos un participante');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_group_chat', {
        _name: groupName.trim(),
        _description: groupDescription.trim() || null,
        _creator_id: user?.id,
        _participant_ids: selectedUsers,
      });

      if (error) throw error;

      setSelectedRoom(data);
      setShowGroupChat(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);
      await loadChatRooms();
      toast.success('Chat grupal creado exitosamente');
    } catch (error) {
      console.error('Error creating group chat:', error);
      toast.error('Error al crear el chat grupal');
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRoomData = rooms.find(room => room.id === selectedRoom);

  const getMessageStatusIcon = (status: string, isOwnMessage: boolean) => {
    if (!isOwnMessage) return null;
    
    switch (status) {
      case 'sending':
        return <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <div className="h-3 w-3 bg-red-500 rounded-full" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar con lista de chats */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Chats</h2>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <div title="Conectado en tiempo real">
                    <Wifi className="h-4 w-4 text-green-500" />
                  </div>
                ) : (
                  <div title="Desconectado">
                    <WifiOff className="h-4 w-4 text-red-500" />
                  </div>
                )}
                {notificationsSupported && (
                  notificationPermission === 'granted' ? (
                    <div title="Notificaciones activas">
                      <Bell className="h-4 w-4 text-green-500" />
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer hover:text-blue-500" 
                      onClick={requestNotificationPermission}
                      title="Activar notificaciones"
                    >
                      <BellOff className="h-4 w-4 text-gray-400" />
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNewChat(true)}
                title="Nuevo chat privado"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => setShowGroupChat(true)}
                title="Nuevo chat grupal"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="mb-3 flex items-center justify-between">
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Conectado" : "Reconectando..."}
            </Badge>
            {!isConnected && (
              <Button size="sm" variant="outline" onClick={reconnect} className="text-xs h-6 px-2">
                Reconectar
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {rooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tienes chats activos</p>
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
                      {room.is_group ? <Users className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{room.name}</p>
                      <p className="text-xs opacity-70">
                        {room.is_group ? 'Grupo' : 'Privado'} • {format(new Date(room.created_at), 'dd/MM', { locale: es })}
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {selectedRoomData?.is_group ? <Users className="h-5 w-5 text-primary" /> : <MessageCircle className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedRoomData?.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Chat {selectedRoomData?.is_group ? 'grupal' : 'privado'}</span>
                      {typingUsers.length > 0 && (
                        <span className="text-blue-500 animate-pulse">
                          {typingUsers.length === 1 
                            ? `${typingUsers[0].userName} está escribiendo...`
                            : `${typingUsers.length} personas están escribiendo...`
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!isConnected && (
                  <Badge variant="destructive" className="text-xs">
                    Sin conexión
                  </Badge>
                )}
              </div>
            </div>

            {/* Mensajes */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.user_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100'
                        } ${message.isOptimistic ? 'opacity-70' : ''}`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-medium mb-1">
                            {message.profiles?.full_name || message.profiles?.email}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs opacity-70">
                            {format(new Date(message.created_at), 'HH:mm', { locale: es })}
                          </p>
                          {getMessageStatusIcon(message.status, isOwnMessage)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input para nuevo mensaje */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Escribe un mensaje..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="sm" 
                  className="gap-2"
                  disabled={!newMessage.trim() || !isConnected}
                >
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
                Chat en Tiempo Real Mejorado
              </h3>
              <p className="text-gray-500 mb-4">
                Selecciona una conversación o crea una nueva
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowNewChat(true)} variant="outline">
                  Chat Privado
                </Button>
                <Button onClick={() => setShowGroupChat(true)}>
                  Chat Grupal
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog para nuevo chat privado */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Chat Privado</DialogTitle>
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
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para nuevo chat grupal */}
      <Dialog open={showGroupChat} onOpenChange={setShowGroupChat}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Chat Grupal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre del grupo"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <Input
              placeholder="Descripción (opcional)"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                      selectedUsers.includes(user.id) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedUsers(prev => 
                        prev.includes(user.id)
                          ? prev.filter(id => id !== user.id)
                          : [...prev, user.id]
                      );
                    }}
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
                      <p className="text-sm opacity-70">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {selectedUsers.length > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {selectedUsers.length} usuario(s) seleccionado(s)
                </p>
                <Button onClick={createGroupChat}>
                  Crear Grupo
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OptimizedChatInterface;
