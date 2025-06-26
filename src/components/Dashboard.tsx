
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, Users, TrendingUp, Activity } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from "recharts";
import UserStatisticsChart from "@/components/dashboard/UserStatisticsChart";
import PeriodComparisonChart from "@/components/dashboard/PeriodComparisonChart";

const Dashboard = () => {
  const { data: estadisticas, isLoading } = useQuery({
    queryKey: ["dashboard-estadisticas"],
    queryFn: async () => {
      console.log("Fetching dashboard statistics...");
      
      // Obtener incidencias con sus relaciones
      const { data: incidencias } = await supabase
        .from("incidencias")
        .select(`
          *,
          areas(nombre),
          clasificaciones(nombre, color)
        `);

      console.log("Incidencias data:", incidencias);

      if (!incidencias) return {
        total: 0,
        porPrioridad: {},
        porArea: {},
        porClasificacion: {},
        recientes: 0,
        tendencia: []
      };

      const prioridadCount = incidencias.reduce((acc: any, inc: any) => {
        acc[inc.prioridad] = (acc[inc.prioridad] || 0) + 1;
        return acc;
      }, {});

      const areaCount = incidencias.reduce((acc: any, inc: any) => {
        const area = inc.areas?.nombre || 'Sin área';
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {});

      const clasificacionCount = incidencias.reduce((acc: any, inc: any) => {
        const clasificacion = inc.clasificaciones?.nombre || 'Sin clasificación';
        acc[clasificacion] = (acc[clasificacion] || 0) + 1;
        return acc;
      }, {});

      // Contar incidencias de las últimas 24 horas
      const hace24Horas = new Date();
      hace24Horas.setHours(hace24Horas.getHours() - 24);
      
      const recientes = incidencias.filter(inc => 
        new Date(inc.created_at) > hace24Horas
      ).length;

      // Crear datos de tendencia por los últimos 7 días
      const tendencia = [];
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        const count = incidencias.filter(inc => 
          inc.created_at.startsWith(fechaStr)
        ).length;
        
        tendencia.push({
          fecha: fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          incidencias: count
        });
      }

      return {
        total: incidencias.length,
        porPrioridad: prioridadCount,
        porArea: areaCount,
        porClasificacion: clasificacionCount,
        recientes,
        tendencia
      };
    },
  });

  const PRIORITY_COLORS = {
    'critica': '#DC2626',
    'alta': '#EA580C', 
    'media': '#CA8A04',
    'baja': '#16A34A'
  };

  const CLASSIFICATION_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#EC4899'];

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const dataPorArea = Object.entries(estadisticas?.porArea || {}).map(([area, count]) => ({
    area,
    cantidad: count,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  const dataPorClasificacion = Object.entries(estadisticas?.porClasificacion || {}).map(([clasificacion, count], index) => ({
    name: clasificacion,
    value: count,
    fill: CLASSIFICATION_COLORS[index % CLASSIFICATION_COLORS.length]
  }));

  const dataPorPrioridad = Object.entries(estadisticas?.porPrioridad || {}).map(([prioridad, count]) => ({
    prioridad,
    cantidad: count,
    fill: PRIORITY_COLORS[prioridad as keyof typeof PRIORITY_COLORS] || '#6B7280'
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Ejecutivo</h1>
        <p className="text-gray-600">Monitoreo integral del sistema de incidencias</p>
      </div>

      {/* Tarjetas de resumen mejoradas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Incidencias</CardTitle>
            <AlertTriangle className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{estadisticas?.total || 0}</div>
            <p className="text-xs opacity-80 mt-1">Registradas en el sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Prioridad Alta</CardTitle>
            <Clock className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {estadisticas?.porPrioridad?.alta || 0}
            </div>
            <p className="text-xs opacity-80 mt-1">Requieren atención urgente</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-700 to-red-800 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Prioridad Crítica</CardTitle>
            <Activity className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {estadisticas?.porPrioridad?.critica || 0}
            </div>
            <p className="text-xs opacity-80 mt-1">Atención inmediata</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Últimas 24h</CardTitle>
            <TrendingUp className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {estadisticas?.recientes || 0}
            </div>
            <p className="text-xs opacity-80 mt-1">Incidencias nuevas</p>
          </CardContent>
        </Card>
      </div>

      {/* Nuevos componentes de estadísticas */}
      <UserStatisticsChart />
      <PeriodComparisonChart />

      {/* Gráfico de tendencia */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Tendencia Semanal
          </CardTitle>
          <CardDescription>Evolución de incidencias en los últimos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={estadisticas?.tendencia || []}>
              <defs>
                <linearGradient id="colorIncidencias" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="fecha" 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="incidencias" 
                stroke="#3B82F6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorIncidencias)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráficos principales mejorados */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">Distribución por Área</CardTitle>
            <CardDescription>Incidencias clasificadas por área organizacional</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dataPorArea} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="area" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  tick={{ fontSize: 11 }}
                  stroke="#6B7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="cantidad" 
                  radius={[4, 4, 0, 0]}
                  stroke="#1E40AF"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl">Clasificación de Incidencias</CardTitle>
            <CardDescription>Distribución por tipo de incidencia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={dataPorClasificacion}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#FFF"
                  strokeWidth={2}
                >
                  {dataPorClasificacion.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Prioridades mejorado */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-xl">Análisis de Prioridades</CardTitle>
          <CardDescription>Distribución de incidencias según nivel de criticidad</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={dataPorPrioridad} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
              />
              <YAxis 
                type="category"
                dataKey="prioridad" 
                tick={{ fontSize: 12 }}
                stroke="#6B7280"
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="cantidad" 
                radius={[0, 4, 4, 0]}
                stroke="#FFF"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
