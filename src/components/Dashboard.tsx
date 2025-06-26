import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, AlertTriangle, Calendar, Users } from "lucide-react";
import UserStatisticsChart from "./dashboard/UserStatisticsChart";
import PeriodComparisonChart from "./dashboard/PeriodComparisonChart";
import ConsolidadoDiario from "./ConsolidadoDiario";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  // Datos de ejemplo para las tarjetas de resumen
  const summaryData = [
    { title: "Incidencias Totales", value: 1250, icon: TrendingUp, color: "text-blue-500" },
    { title: "Alertas Críticas", value: 150, icon: AlertTriangle, color: "text-red-500" },
    { title: "Eventos Hoy", value: 75, icon: Calendar, color: "text-green-500" },
    { title: "Usuarios Activos", value: 320, icon: Users, color: "text-purple-500" },
  ];

  // Estadísticas de ejemplo para el gráfico de barras
  const barChartData = [
    { name: 'Ene', uv: 4000, pv: 2400, amt: 2400 },
    { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
    { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
    { name: 'Abr', uv: 2780, pv: 3908, amt: 2000 },
    { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
    { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
    { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
  ];

  // Datos de ejemplo para el gráfico circular
  const pieChartData = [
    { name: 'Grupo A', value: 400 },
    { name: 'Grupo B', value: 300 },
    { name: 'Grupo C', value: 300 },
    { name: 'Grupo D', value: 200 },
    { name: 'Grupo E', value: 278 },
    { name: 'Grupo F', value: 189 },
  ];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard - Monitoreo Casino</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="incidents">Incidencias</TabsTrigger>
          <TabsTrigger value="monitors">Monitores</TabsTrigger>
          <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryData.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Incidencias</CardTitle>
                <CardDescription>Comparación mensual de incidencias reportadas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="pv" fill="#8884d8" />
                    <Bar dataKey="uv" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Incidencias</CardTitle>
                <CardDescription>Porcentaje de incidencias por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Incidencias</CardTitle>
              <CardDescription>Lista detallada de todas las incidencias reportadas</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Aquí iría la tabla de incidencias con opciones de filtrado y gestión.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitors" className="space-y-4">
          <UserStatisticsChart />
        </TabsContent>

        <TabsContent value="consolidado" className="space-y-4">
          <ConsolidadoDiario />
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Comparativo</CardTitle>
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
