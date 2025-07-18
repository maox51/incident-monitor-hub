import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, AlertTriangle, Calendar, Users, Database, Clock, Activity, Shield } from "lucide-react";
import MonitorPerformance from "./dashboard/MonitorPerformance";
import ConsolidadoDiario from "./ConsolidadoDiario";
import PeriodComparisonChart from "./dashboard/PeriodComparisonChart";
import AuditLog from "./admin/AuditLog";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { StatsCard } from "@/components/ui/stats-card";
import { LoadingCard } from "@/components/ui/loading-spinner";

const COLORS = ['#DC2626', '#EA580C', '#D97706', '#65A30D'];

const Dashboard = () => {
  const { logAction } = useAuditLog();
  const { profile } = useAuth();

  // Registrar acceso al dashboard
  useEffect(() => {
    logAction('view_dashboard', 'dashboard', null, { 
      page: 'dashboard',
      timestamp: new Date().toISOString()
    });
  }, []);

  // Obtener estadísticas reales del sistema - SOLO INCIDENCIAS APROBADAS
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: incidencias, error } = await supabase
        .from("incidencias")
        .select("*")
        .eq("estado", "aprobado");
      
      if (error) throw error;

      const hoy = new Date().toISOString().split('T')[0];
      const incidenciasHoy = incidencias?.filter(inc => 
        inc.created_at.split('T')[0] === hoy
      ) || [];

      const criticas = incidencias?.filter(inc => inc.prioridad === 'critica').length || 0;
      
      return {
        totalIncidencias: incidencias?.length || 0,
        incidenciasHoy: incidenciasHoy.length,
        incidenciasCriticas: criticas,
        usuariosActivos: new Set(incidencias?.map(inc => inc.reportado_por)).size || 0
      };
    },
  });

  // Obtener datos por sala con minutos de retraso - SOLO INCIDENCIAS APROBADAS
  const { data: salaData } = useQuery({
    queryKey: ["sala-analysis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidencias")
        .select(`
          sala_id,
          tiempo_minutos,
          prioridad,
          salas(nombre)
        `)
        .eq("estado", "aprobado")
        .not("sala_id", "is", null);
      
      if (error) throw error;

      const salaStats: { [key: string]: { 
        nombre: string;
        totalIncidencias: number; 
        tiempoTotal: number; 
        criticas: number; 
        altas: number;
        promedioMinutos: number;
      } } = {};
      
      data?.forEach(inc => {
        const salaNombre = inc.salas?.nombre || 'Sin sala';
        if (!salaStats[salaNombre]) {
          salaStats[salaNombre] = { 
            nombre: salaNombre,
            totalIncidencias: 0, 
            tiempoTotal: 0, 
            criticas: 0,
            altas: 0,
            promedioMinutos: 0
          };
        }
        salaStats[salaNombre].totalIncidencias++;
        salaStats[salaNombre].tiempoTotal += inc.tiempo_minutos || 0;
        if (inc.prioridad === 'critica') salaStats[salaNombre].criticas++;
        if (inc.prioridad === 'alta') salaStats[salaNombre].altas++;
      });

      // Calcular promedios
      Object.values(salaStats).forEach(sala => {
        sala.promedioMinutos = sala.totalIncidencias > 0 
          ? Math.round(sala.tiempoTotal / sala.totalIncidencias) 
          : 0;
      });

      return Object.values(salaStats).sort((a, b) => b.tiempoTotal - a.tiempoTotal);
    },
  });

  // Obtener datos para gráfico de tendencias por mes - SOLO INCIDENCIAS APROBADAS
  const { data: monthlyData } = useQuery({
    queryKey: ["monthly-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidencias")
        .select("created_at, prioridad")
        .eq("estado", "aprobado"); // Solo incidencias aprobadas
      
      if (error) throw error;

      const monthlyStats: { [key: string]: { total: number; criticas: number; altas: number } } = {};
      
      data?.forEach(inc => {
        const month = new Date(inc.created_at).toLocaleDateString('es-ES', { month: 'short' });
        if (!monthlyStats[month]) {
          monthlyStats[month] = { total: 0, criticas: 0, altas: 0 };
        }
        monthlyStats[month].total++;
        if (inc.prioridad === 'critica') monthlyStats[month].criticas++;
        if (inc.prioridad === 'alta') monthlyStats[month].altas++;
      });

      return Object.entries(monthlyStats).map(([month, stats]) => ({
        name: month,
        total: stats.total,
        criticas: stats.criticas,
        altas: stats.altas
      }));
    },
  });

  // Obtener distribución por prioridad - SOLO INCIDENCIAS APROBADAS
  const { data: priorityData } = useQuery({
    queryKey: ["priority-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidencias")
        .select("prioridad")
        .eq("estado", "aprobado"); // Solo incidencias aprobadas
      
      if (error) throw error;

      const distribution: { [key: string]: number } = {};
      data?.forEach(inc => {
        distribution[inc.prioridad] = (distribution[inc.prioridad] || 0) + 1;
      });

      return Object.entries(distribution).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));
    },
  });

  if (statsLoading) {
    return <LoadingCard />;
  }

  const summaryData = [
    { 
      title: "Incidencias Totales", 
      value: stats?.totalIncidencias || 0, 
      icon: Database, 
      color: "text-blue-500" 
    },
    { 
      title: "Alertas Críticas", 
      value: stats?.incidenciasCriticas || 0, 
      icon: AlertTriangle, 
      color: "text-red-500" 
    },
    { 
      title: "Eventos Hoy", 
      value: stats?.incidenciasHoy || 0, 
      icon: Calendar, 
      color: "text-green-500" 
    },
    { 
      title: "Monitores Activos", 
      value: stats?.usuariosActivos || 0, 
      icon: Users, 
      color: "text-purple-500" 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard - Monitoreo Salas</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="salas">Por Salas</TabsTrigger>
          <TabsTrigger value="monitors">Rendimiento Monitores</TabsTrigger>
          <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Incidencias Totales"
              value={stats?.totalIncidencias || 0}
              description="Total de incidencias aprobadas"
              icon={Database}
              gradient="blue"
            />
            <StatsCard
              title="Alertas Críticas"
              value={stats?.incidenciasCriticas || 0}
              description="Requieren atención inmediata"
              icon={AlertTriangle}
              gradient="red"
            />
            <StatsCard
              title="Eventos Hoy"
              value={stats?.incidenciasHoy || 0}
              description="Incidencias registradas hoy"
              icon={Calendar}
              gradient="green"
            />
            <StatsCard
              title="Monitores Activos"
              value={stats?.usuariosActivos || 0}
              description="Usuarios reportando incidencias"
              icon={Users}
              gradient="purple"
            />
          </div>

          {(monthlyData && monthlyData.length > 0) || (priorityData && priorityData.length > 0) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {monthlyData && monthlyData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Tendencia de Incidencias</CardTitle>
                    <CardDescription>Comparación mensual de incidencias reportadas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#3B82F6" name="Total" />
                        <Bar dataKey="criticas" fill="#DC2626" name="Críticas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {priorityData && priorityData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Distribución de Prioridades</CardTitle>
                    <CardDescription>Porcentaje de incidencias por nivel de prioridad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sin Datos Suficientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Aún no hay suficientes incidencias registradas para mostrar gráficos. 
                  Comienza registrando algunas incidencias para ver las estadísticas.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="salas" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Análisis por Salas - Tiempo de Retraso
                </CardTitle>
                <CardDescription>
                  Minutos de retraso acumulados y promedio por sala
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salaData && salaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={salaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="nombre" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'tiempoTotal') return [`${value} min`, 'Tiempo Total'];
                          if (name === 'promedioMinutos') return [`${value} min`, 'Promedio'];
                          if (name === 'totalIncidencias') return [value, 'Incidencias'];
                          if (name === 'criticas') return [value, 'Críticas'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Sala: ${label}`}
                      />
                      <Bar dataKey="tiempoTotal" fill="#DC2626" name="Tiempo Total (min)" />
                      <Bar dataKey="promedioMinutos" fill="#3B82F6" name="Promedio (min)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No hay datos de salas disponibles
                  </p>
                )}
              </CardContent>
            </Card>

            {salaData && salaData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle por Salas</CardTitle>
                  <CardDescription>Resumen detallado de incidencias por sala</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {salaData.slice(0, 9).map((sala, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">{sala.nombre}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total incidencias:</span>
                            <span className="font-medium">{sala.totalIncidencias}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tiempo total:</span>
                            <span className="font-medium text-red-600">{sala.tiempoTotal} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Promedio:</span>
                            <span className="font-medium text-blue-600">{sala.promedioMinutos} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Críticas:</span>
                            <span className="font-medium text-red-500">{sala.criticas}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Altas:</span>
                            <span className="font-medium text-orange-500">{sala.altas}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="monitors" className="space-y-4">
          <MonitorPerformance />
        </TabsContent>

        <TabsContent value="consolidado" className="space-y-4">
          <ConsolidadoDiario />
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Análisis Comparativo</CardTitle>
              <CardDescription>Comparación del rendimiento del sistema en diferentes periodos</CardDescription>
            </CardHeader>
            <CardContent>
              <PeriodComparisonChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          {profile?.role === 'admin' ? (
            <AuditLog />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Acceso Restringido</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Solo los administradores pueden acceder al registro de auditoría.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
