
import React, { useState } from 'react';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  AlertTriangle,
  FileCheck,
  Clock,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3, 
      roles: ['admin', 'supervisor_monitoreo', 'monitor'] 
    },
    { 
      id: 'incidencias', 
      label: 'Incidencias', 
      icon: AlertTriangle, 
      roles: ['admin', 'supervisor_monitoreo', 'monitor'] 
    },
    { 
      id: 'solicitudes', 
      label: 'Solicitudes', 
      icon: MessageSquare, 
      roles: ['admin', 'supervisor_monitoreo', 'monitor', 'rrhh', 'finanzas', 'supervisor_salas'] 
    },
    { 
      id: 'reportes', 
      label: 'Reportes', 
      icon: FileText, 
      roles: ['admin', 'supervisor_monitoreo', 'monitor'] 
    },
    { 
      id: 'borradores', 
      label: 'Borradores', 
      icon: FileCheck, 
      roles: ['admin', 'supervisor_monitoreo'] 
    },
    { 
      id: 'monitoreo-salas', 
      label: 'Monitoreo de Salas', 
      icon: Clock, 
      roles: ['admin', 'supervisor_monitoreo', 'monitor'] 
    },
    { 
      id: 'estado-maquinas', 
      label: 'Estado Máquinas', 
      icon: MessageSquare, 
      roles: ['admin', 'tecnico'] 
    },
    { 
      id: 'admin', 
      label: 'Admin', 
      icon: Users, 
      roles: ['admin'] 
    },
    { 
      id: 'audit', 
      label: 'Audit Log', 
      icon: Shield, 
      roles: ['admin'] 
    }
  ];

  const visibleItems = menuItems.filter(item => 
    item.roles.includes(profile?.role || '')
  );

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-800">
            Sistema Monitor
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isCollapsed ? 'px-2' : 'px-4'
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span className="ml-2">{item.label}</span>}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-4 left-0 right-0 px-4">
        <Button
          variant="outline"
          className={`w-full ${isCollapsed ? 'px-2' : 'px-4'}`}
          onClick={handleSignOut}
        >
          <Settings size={20} />
          {!isCollapsed && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
