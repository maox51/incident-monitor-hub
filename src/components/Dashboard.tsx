
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
      
      // Obtener conteos por estado
      const { data: incidencias } = await supabase
        .from("incidencias")
        .select("estado, prioridad, area_id, clasificacion_id, areas(nombre), clasificaciones(nombre, color)");

      console.log("Incidencias data:", incidencias);

      const estadoCount = incidencias?.reduce((acc: any, inc: any) => {
        acc[inc.estado] = (acc[inc.estado] || 0) + 1;
        return acc;
      }, {}) || {};

      const prioridadCount = incidencias?.reduce((acc: any, inc: any) => {
        acc[inc.prioridad] = (acc[inc.prioridad] || 0) + 1;
        return acc;
      }, {}) || {};

      const areaCount = incidencias?.reduce((acc: any, inc: any) => {
        const area = inc.areas?.nombre || 'Sin área';
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {}) || {};

      const clasificacionCount = incidencias?.reduce((acc: any, inc: any) => {
        const clasificacion = inc.clasificaciones?.nombre || 'Sin clasificación';
        acc[clasificacion] = (acc[clasificacion] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        total: incidencias?.length || 0,
        porEstado: estadoCount,
        porPrioridad: prioridadCount,
        porArea: areaCount,
        porClasificacion: clasificacionCount
      };
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
            <CardTitle className="text-sm font-medium">Abiertas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {estadisticas?.porEstado?.abierta || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {estadisticas?.porEstado?.resuelta || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {estadisticas?.porEstado?.en_proceso || 0}
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
    </div>
  );
};

export default Dashboard;
