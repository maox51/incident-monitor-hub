import { useState } from "react";
import { 
  AlertTriangle, 
  BarChart3, 
  FileText, 
  Users, 
  Calendar, 
  Upload, 
  Clock, 
  MonitorSpeaker, 
  MessageSquare, 
  DollarSign,
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { open } = useSidebar();
  const { profile, isAdmin, isMonitor, isSupervisorMonitoreo, isRRHH, isSupervisorSalas, isFinanzas, isMantenimiento, isLector, isGestorSolicitudes } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin'] },
    { id: 'nueva-incidencia', label: 'Nueva Incidencia', icon: AlertTriangle, roles: ['admin', 'monitor', 'supervisor_monitoreo'] },
    { id: 'solicitudes', label: 'Solicitudes', icon: MessageSquare, roles: ['admin', 'supervisor_monitoreo', 'monitor', 'rrhh', 'finanzas', 'supervisor_salas', 'mantenimiento', 'gestor_solicitudes'] },
    { id: 'pagos724', label: 'Pagos 724', icon: DollarSign, roles: ['admin', 'supervisor_monitoreo', 'monitor', 'rrhh', 'finanzas', 'supervisor_salas'] },
    { id: 'borradores', label: 'Aprobar Incidencias', icon: Clock, roles: ['supervisor_monitoreo', 'admin'] },
    { id: 'consolidado', label: 'Consolidado Diario', icon: Calendar, roles: ['admin', 'rrhh', 'supervisor_salas', 'finanzas', 'mantenimiento', 'lector'] },
    { id: 'reportes', label: 'Reportes', icon: FileText, roles: ['admin', 'rrhh', 'supervisor_salas', 'finanzas', 'mantenimiento', 'lector'] },
    { id: 'monitoreo-salas', label: 'Monitoreo de Salas', icon: MonitorSpeaker, roles: ['admin', 'rrhh', 'lector'] },
    { id: 'usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] },
    { id: 'importar', label: 'Importar Datos', icon: Upload, roles: ['admin'] },
  ];

  // Determinar qué roles tiene el usuario actual
  const userRoles = [];
  if (isAdmin) userRoles.push('admin');
  if (isMonitor) userRoles.push('monitor');
  if (isSupervisorMonitoreo) userRoles.push('supervisor_monitoreo');
  if (isRRHH) userRoles.push('rrhh');
  if (isSupervisorSalas) userRoles.push('supervisor_salas');
  if (isFinanzas) userRoles.push('finanzas');
  if (isMantenimiento) userRoles.push('mantenimiento');
  if (isLector) userRoles.push('lector');
  if (isGestorSolicitudes) userRoles.push('gestor_solicitudes');

  // Filtrar items del menú según los roles del usuario
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  );

  // Dividir items en grupos lógicos
  const mainItems = filteredMenuItems.filter(item => 
    ['dashboard', 'nueva-incidencia', 'borradores'].includes(item.id)
  );
  
  const moduleItems = filteredMenuItems.filter(item => 
    ['solicitudes', 'pagos724'].includes(item.id)
  );
  
  const reportItems = filteredMenuItems.filter(item => 
    ['reportes', 'consolidado', 'monitoreo-salas'].includes(item.id)
  );
  
  const adminItems = filteredMenuItems.filter(item => 
    ['usuarios', 'importar'].includes(item.id)
  );

  const renderMenuGroup = (items: typeof menuItems, label: string) => {
    if (items.length === 0) return null;
    
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => onTabChange(item.id)}
                    isActive={isActive}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <AlertTriangle className="h-4 w-4 text-primary-foreground" />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Insight360</span>
              <span className="text-xs text-muted-foreground">Esva</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-2">
          {renderMenuGroup(mainItems, "Principal")}
          {renderMenuGroup(moduleItems, "Módulos")}
          {renderMenuGroup(reportItems, "Reportes")}
          {renderMenuGroup(adminItems, "Administración")}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-xs">
              {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">
                {profile?.full_name || profile?.email}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {profile?.role?.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {open && <span>Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}