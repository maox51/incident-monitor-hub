
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, profile, signOut, isAdmin } = useAuth();

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white';
  };

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? 'Administrador' : 'Monitor';
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Sistema de Incidencias
          </h2>
          {profile?.role && (
            <Badge className={getRoleColor(profile.role)}>
              {getRoleLabel(profile.role)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {profile?.full_name || user?.email}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Mi Cuenta
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{profile?.full_name || 'Usuario'}</span>
                  <span className="text-gray-500">{user?.email}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Administración
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;
