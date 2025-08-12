import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Edit, Trash2, Shield, Mail, Key, Building, Database } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Database as DatabaseType } from '@/integrations/supabase/types';
import BackupManagement from './BackupManagement';

type AppRole = DatabaseType['public']['Enums']['app_role'];

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

interface Area {
  id: string;
  nombre: string;
}

interface UserAreaAccess {
  id: string;
  user_id: string;
  departamento_id: string;
  departamento?: Area;
}

const UserManagement = () => {
  const { resetPassword } = useAuth();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  // Obtener todos los usuarios
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });

  // Obtener departamentos
  const { data: areas } = useQuery({
    queryKey: ['departamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departamentos')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data as Area[];
    },
  });

  // Obtener accesos por área del usuario seleccionado
  const { data: userAreaAccess } = useQuery({
    queryKey: ['user-area-access', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase
        .from('user_area_access')
        .select(`
          *,
          departamento:departamentos(*)
        `)
        .eq('user_id', selectedUser.id);

      if (error) throw error;
      return data as UserAreaAccess[];
    },
    enabled: !!selectedUser,
  });

  // Mutation para actualizar usuario
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates, areaIds }: { userId: string; updates: Partial<Profile>; areaIds?: string[] }) => {
      // Actualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (profileError) throw profileError;

      // Si se proporcionan áreas, actualizar accesos
      if (areaIds !== undefined) {
        // Eliminar accesos existentes
        const { error: deleteError } = await supabase
          .from('user_area_access')
          .delete()
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // Insertar nuevos accesos
        if (areaIds.length > 0) {
          const accesses = areaIds.map(areaId => ({
            user_id: userId,
            departamento_id: areaId
          }));

          const { error: insertError } = await supabase
            .from('user_area_access')
            .insert(accesses);

          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      queryClient.invalidateQueries({ queryKey: ['user-area-access'] });
      toast.success('Usuario actualizado correctamente');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setSelectedAreas([]);
    },
    onError: (error) => {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar usuario');
    },
  });

  // Mutation para reset de contraseña admin
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { email, newPassword: password }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    },
    onError: (error) => {
      console.error('Error resetting password:', error);
      toast.error('Error al actualizar la contraseña');
    },
  });

  // Mutation para eliminar usuario
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      toast.success('Usuario eliminado correctamente');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario. El usuario puede tener incidencias asociadas.');
    },
  });

  const handleEditUser = (user: Profile) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
    // Cargar áreas del usuario si es un rol que las necesita
    if (['finanzas', 'rrhh', 'supervisor_salas', 'gestor_solicitudes'].includes(user.role)) {
      queryClient.invalidateQueries({ queryKey: ['user-area-access', user.id] });
    }
  };

  const handleDeleteUser = (user: Profile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: Profile) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updates = {
      full_name: formData.get('fullName') as string,
      role: formData.get('role') as AppRole,
    };

    const requiresAreaAccess = ['finanzas', 'rrhh', 'supervisor_salas', 'gestor_solicitudes'].includes(updates.role);
    
    updateUserMutation.mutate({ 
      userId: selectedUser.id, 
      updates,
      areaIds: requiresAreaAccess ? selectedAreas : undefined
    });
  };

  // Filtrar usuarios
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" />Administrador</Badge>;
      case 'monitor':
        return <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />Monitor</Badge>;
      case 'supervisor_monitoreo':
        return <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" />Supervisor de Monitoreo</Badge>;
      case 'rrhh':
        return <Badge variant="default" className="gap-1"><Building className="h-3 w-3" />RRHH</Badge>;
      case 'supervisor_salas':
        return <Badge className="gap-1 bg-purple-600"><Building className="h-3 w-3" />Supervisor de Salas</Badge>;
      case 'finanzas':
        return <Badge className="gap-1 bg-green-600"><Building className="h-3 w-3" />Finanzas</Badge>;
      case 'mantenimiento':
        return <Badge className="gap-1 bg-orange-600"><Building className="h-3 w-3" />Mantenimiento</Badge>;
      case 'tecnico':
        return <Badge className="gap-1 bg-blue-600"><Building className="h-3 w-3" />Técnico</Badge>;
      case 'lector':
        return <Badge className="gap-1 bg-gray-600"><Users className="h-3 w-3" />Lector</Badge>;
      case 'gestor_solicitudes':
        return <Badge className="gap-1 bg-indigo-600"><Building className="h-3 w-3" />Gestor de Solicitudes</Badge>;
      default:
        return <Badge variant="outline">Sin rol</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona usuarios, permisos y backups del sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            Total: {users?.length || 0} usuarios
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gestión de Usuarios
          </TabsTrigger>
          <TabsTrigger value="backups" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backups del Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6 mt-6">

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar usuario</Label>
              <Input
                id="search"
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-filter">Filtrar por rol</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="monitor">Monitores</SelectItem>
                    <SelectItem value="supervisor_monitoreo">Supervisor de Monitoreo</SelectItem>
                    <SelectItem value="rrhh">RRHH</SelectItem>
                    <SelectItem value="supervisor_salas">Supervisor de Salas</SelectItem>
                    <SelectItem value="finanzas">Finanzas</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="lector">Lector</SelectItem>
                    <SelectItem value="gestor_solicitudes">Gestor de Solicitudes</SelectItem>
                  </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>
            Gestiona los usuarios registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.full_name || 'Sin nombre'}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredUsers || filteredUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No se encontraron usuarios</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información y permisos del usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={selectedUser?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={selectedUser?.full_name || ''}
                  placeholder="Nombre completo del usuario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select 
                  name="role" 
                  defaultValue={selectedUser?.role}
                  onValueChange={(value) => {
                    const requiresAreaAccess = ['finanzas', 'rrhh', 'supervisor_salas', 'gestor_solicitudes'].includes(value);
                    if (!requiresAreaAccess) {
                      setSelectedAreas([]);
                    } else {
                      // Pre-cargar áreas actuales del usuario
                      const currentAreas = userAreaAccess?.map(access => access.departamento_id) || [];
                      setSelectedAreas(currentAreas);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="supervisor_monitoreo">Supervisor de Monitoreo</SelectItem>
                    <SelectItem value="rrhh">RRHH</SelectItem>
                    <SelectItem value="supervisor_salas">Supervisor de Salas</SelectItem>
                    <SelectItem value="finanzas">Finanzas</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="lector">Lector</SelectItem>
                    <SelectItem value="gestor_solicitudes">Gestor de Solicitudes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Selector de áreas para roles específicos */}
              {selectedUser && ['finanzas', 'rrhh', 'supervisor_salas', 'gestor_solicitudes'].includes(selectedUser.role) && (
                <div className="space-y-2">
                  <Label>Áreas de Acceso</Label>
                  <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                    {areas?.map((area) => (
                      <div key={area.id} className="flex items-center space-x-2 py-2">
                        <Checkbox
                          id={`area-${area.id}`}
                          checked={selectedAreas.includes(area.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAreas(prev => [...prev, area.id]);
                            } else {
                              setSelectedAreas(prev => prev.filter(id => id !== area.id));
                            }
                          }}
                        />
                        <Label htmlFor={`area-${area.id}`} className="text-sm">
                          {area.nombre}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Solo verá incidencias de las áreas seleccionadas
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Actualizando...' : 'Actualizar Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para reset de contraseña */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña para el usuario {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa la nueva contraseña"
                minLength={6}
              />
              <p className="text-xs text-gray-500">
                La contraseña debe tener al menos 6 caracteres
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => resetPasswordMutation.mutate({ 
                email: selectedUser!.email, 
                password: newPassword 
              })}
              disabled={resetPasswordMutation.isPending || !newPassword}
            >
              {resetPasswordMutation.isPending ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Usuario a eliminar:</strong> {selectedUser?.email}
              </p>
              <p className="text-sm text-red-600 mt-2">
                Se eliminarán todos los datos asociados a este usuario.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteUserMutation.mutate(selectedUser!.id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Eliminando...' : 'Eliminar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="backups" className="mt-6">
          <BackupManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;