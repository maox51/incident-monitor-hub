import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, AlertTriangle, Calendar, Users, Database } from "lucide-react";
import MonitorKPIs from "./dashboard/MonitorKPIs";
import ConsolidadoDiario from "./ConsolidadoDiario";
import PeriodComparisonChart from "./dashboard/PeriodComparisonChart";

const COLORS = ['#DC2626', '#EA580C', '#D97706', '#65A30D'];

const Dashboard = () => {
  // Obtener estadísticas reales del sistema
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: incidencias, error } = await supabase
        .from("incidencias")
        .select("*");
      
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

  // Obtener datos para gráfico de tendencias por mes
  const { data: monthlyData } = useQuery({
    queryKey: ["monthly-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidencias")
        .select("created_at, prioridad");
      
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

  // Obtener distribución por prioridad
  const { data: priorityData } = useQuery({
    queryKey: ["priority-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidencias")
        .select("prioridad");
      
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard - Monitoreo Casino</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="kpis">KPIs Monitores</TabsTrigger>
          <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {summaryData.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <item.icon className={`w-4 h-4 md:w-5 md:h-5 ${item.color}`} />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{item.value}</div>
                </CardContent>
              </Card>
            ))}
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

        <TabsContent value="kpis" className="space-y-4">
          <MonitorKPIs />
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
      </Tabs>
    </div>
  );
};

export default Dashboard;
