
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsCard } from "@/components/ui/stats-card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  AlertTriangle, 
  Calendar,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import IncidenciaForm from './IncidenciaForm';
import ReportesView from './ReportesView';
import UserManagement from './admin/UserManagement';
import AuditLog from './admin/AuditLog';
import BorradoresView from './supervisor/BorradoresView';
import QuinzenalStatsCard from './dashboard/QuinzenalStatsCard';
import PeriodComparisonCard from './dashboard/PeriodComparisonCard';
import SalaTimingModule from './monitoring/SalaTimingModule';
import MonitorKPIs from './dashboard/MonitorKPIs';
import UserStatisticsChart from './dashboard/UserStatisticsChart';

const Dashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!profile) {
      return;
    }
  }, [profile]);

  if (!profile) {
    return <div>Cargando...</div>;
  }

  // Queries para estadísticas del dashboard
  const { data: totalIncidencias } = useQuery({
    queryKey: ["total-incidencias"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("incidencias")
        .select("*", { count: 'exact', head: true })
        .eq("estado", "aprobado");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: alertasCriticas } = useQuery({
    queryKey: ["alertas-criticas"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("incidencias")
        .select("*", { count: 'exact', head: true })
        .eq("estado", "aprobado")
        .eq("prioridad", "critica");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: eventosHoy } = useQuery({
    queryKey: ["eventos-hoy"],
    queryFn: async () => {
      const hoy = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from("incidencias")
        .select("*", { count: 'exact', head: true })
        .eq("estado", "aprobado")
        .gte("fecha_incidencia", hoy)
        .lt("fecha_incidencia", hoy + "T23:59:59");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: monitoresActivos } = useQuery({
    queryKey: ["monitores-activos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidencias")
        .select("reportado_por")
        .eq("estado", "aprobado");
      if (error) throw error;
      const uniqueMonitors = new Set(data?.map(inc => inc.reportado_por) || []);
      return uniqueMonitors.size;
    },
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Tarjetas de estadísticas principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Incidencias Totales"
                value={totalIncidencias || 0}
                description="Total de incidencias aprobadas"
                icon={Activity}
                gradient="blue"
              />
              <StatsCard
                title="Alertas Críticas"
                value={alertasCriticas || 0}
                description="Requieren atención inmediata"
                icon={AlertTriangle}
                gradient="red"
              />
              <StatsCard
                title="Eventos Hoy"
                value={eventosHoy || 0}
                description="Incidencias registradas hoy"
                icon={Calendar}
                gradient="green"
              />
              <StatsCard
                title="Monitores Activos"
                value={monitoresActivos || 0}
                description="Usuarios reportando incidencias"
                icon={Users}
                gradient="purple"
              />
            </div>

            {/* Gráficos y estadísticas quincenales */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <QuinzenalStatsCard />
              <PeriodComparisonCard />
            </div>

            {/* Estadísticas detalladas */}
            <div className="grid grid-cols-1 gap-6">
              <UserStatisticsChart />
              <MonitorKPIs />
            </div>
          </div>
        );
      case 'incidencias':
        return <IncidenciaForm />;
      case 'reportes':
        return <ReportesView />;
      case 'admin':
        return profile?.role === 'admin' ? <UserManagement /> : <div>No tienes permisos para acceder a esta sección.</div>;
      case 'audit':
        return profile?.role === 'admin' ? <AuditLog /> : <div>No tienes permisos para acceder a esta sección.</div>;
      case 'borradores':
        return (profile?.role === 'supervisor_monitoreo' || profile?.role === 'admin') ? 
          <BorradoresView /> : 
          <div>No tienes permisos para acceder a esta sección.</div>;
      case 'monitoreo-salas':
        return <SalaTimingModule />;
      default:
        return <div>Sección no encontrada</div>;
    }
  };

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs responsive */}
        <div className="border-b border-border">
          <div className="flex overflow-x-auto">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-none bg-transparent p-0 gap-0 flex-nowrap min-w-max">
              <TabsTrigger 
                value="dashboard" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-b-transparent px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="incidencias"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-b-transparent px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Incidencias
              </TabsTrigger>
              <TabsTrigger 
                value="reportes"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-b-transparent px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Reportes
              </TabsTrigger>
              {(profile?.role === 'admin' || profile?.role === 'supervisor_monitoreo') && (
                <TabsTrigger 
                  value="borradores"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-b-transparent px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Borradores
                </TabsTrigger>
              )}
              {profile?.role === 'admin' && (
                <TabsTrigger 
                  value="admin"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-b-transparent px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Admin
                </TabsTrigger>
              )}
              {profile?.role === 'admin' && (
                <TabsTrigger 
                  value="audit"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-b-transparent px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Audit Log
                </TabsTrigger>
              )}
              {(profile?.role === 'admin' || profile?.role === 'supervisor_monitoreo' || profile?.role === 'monitor') && (
                <TabsTrigger 
                  value="monitoreo-salas"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-none border-b-2 border-b-transparent px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Monitoreo de Salas
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>
        
        <div className="mt-6">
          <TabsContent value={activeTab} className="mt-0">
            {renderContent()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Dashboard;
