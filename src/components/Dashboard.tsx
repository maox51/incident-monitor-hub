
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
        recientes: 0
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

      return {
        total: incidencias.length,
        porPrioridad: prioridadCount,
        porArea: areaCount,
        porClasificacion: clasificacionCount,
        recientes
      };
    },
  });

  const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#6366F1', '#EC4899'];

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
    cantidad: count
  }));

  const dataPorClasificacion = Object.entries(estadisticas?.porClasificacion || {}).map(([clasificacion, count], index) => ({
    name: clasificacion,
    value: count,
    color: COLORS[index % COLORS.length]
  }));

  const dataPorPrioridad = Object.entries(estadisticas?.porPrioridad || {}).map(([prioridad, count]) => ({
    prioridad,
    cantidad: count
  }));

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prioridad Alta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {estadisticas?.porPrioridad?.alta || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prioridad Crítica</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {estadisticas?.porPrioridad?.critica || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {estadisticas?.recientes || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incidencias por Área</CardTitle>
            <CardDescription>Distribución de incidencias por área de la empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataPorArea}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incidencias por Clasificación</CardTitle>
            <CardDescription>Distribución de incidencias por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataPorClasificacion}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dataPorClasificacion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Prioridades */}
      <Card>
        <CardHeader>
          <CardTitle>Incidencias por Prioridad</CardTitle>
          <CardDescription>Distribución de incidencias según su nivel de prioridad</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataPorPrioridad}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="prioridad" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
