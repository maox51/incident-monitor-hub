
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Settings, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AvatarSelector, UserAvatar } from '@/components/ui/avatar-selector';

const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth();

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      supervisor_monitoreo: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      monitor: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
      finanzas: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
      rrhh: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
      supervisor_salas: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white',
    };
    return colors[role as keyof typeof colors] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      supervisor_monitoreo: 'Supervisor de Monitoreo',
      monitor: 'Monitor',
      finanzas: 'Finanzas',
      rrhh: 'RRHH',
      supervisor_salas: 'Supervisor de Salas',
    };
    return labels[role as keyof typeof labels] || 'Usuario';
  };

  return (
    <div className="bg-gradient-to-r from-white via-slate-50 to-white shadow-lg border-b border-slate-200">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center">
              <img 
                src="/lovable-uploads/e838c224-34ca-4c7c-ae45-56034feffb0c.png" 
                alt="ESVA Logo" 
                className="h-8 w-8 object-contain"
              />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Sistema de Incidencias
            </h2>
          </div>
          {profile?.role && (
            <Badge className={`${getRoleColor(profile.role)} shadow-md border-0 px-3 py-1 text-xs font-medium`}>
              {getRoleLabel(profile.role)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-medium text-slate-700">
              {profile?.full_name || 'Usuario'}
            </span>
            <span className="text-xs text-slate-500">{user?.email}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-3 hover:bg-slate-100 p-2 rounded-full transition-all duration-200 hover:shadow-md"
              >
                <UserAvatar size="sm" />
                <span className="hidden sm:inline text-sm font-medium">Mi Cuenta</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl">
              <DropdownMenuItem className="p-4 cursor-default hover:bg-transparent">
                <div className="flex items-center gap-3 w-full">
                  <UserAvatar size="md" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800">{profile?.full_name || 'Usuario'}</span>
                    <span className="text-sm text-slate-500">{user?.email}</span>
                    {profile?.role && (
                      <Badge className={`${getRoleColor(profile.role)} mt-1 text-xs w-fit`}>
                        {getRoleLabel(profile.role)}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AvatarSelector>
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-slate-50"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Palette className="h-4 w-4 mr-3 text-slate-600" />
                  <span className="text-slate-700">Cambiar Avatar</span>
                </DropdownMenuItem>
              </AvatarSelector>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={signOut} 
                className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-3" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;
