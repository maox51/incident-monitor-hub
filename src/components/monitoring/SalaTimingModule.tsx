
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, RefreshCw, Clock, Building2, BarChart3, Filter, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface SalaStatsData {
  sala_id: string;
  sala_nombre: string;
  año: number;
  mes: number;
  quincena: number;
  minutos_ingresos_tardios: number;
  minutos_cierres_prematuros: number;
  total_incidencias_ingresos: number;
  total_incidencias_cierres: number;
  total_minutos: number;
}

const SalaTimingModule = () => {
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfMonth(new Date()));
  const [fechaFin, setFechaFin] = useState<Date>(endOfMonth(new Date()));
  const [salaFiltro, setSalaFiltro] = useState<string>('todas');
  const [tipoVista, setTipoVista] = useState<'tabla' | 'barras' | 'lineas' | 'torta'>('barras');
  const [mostrarFechaInicio, setMostrarFechaInicio] = useState(false);
  const [mostrarFechaFin, setMostrarFechaFin] = useState(false);

  // Obtener salas disponibles
  const { data: salas } = useQuery({
    queryKey: ['salas-activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salas')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');
      
      if (error) throw error;
      return data;
    }
  });

  // Obtener estadísticas de salas
  const { data: estadisticas, isLoading, refetch } = useQuery({
    queryKey: ['sala-timing-stats', fechaInicio, fechaFin, salaFiltro],
    queryFn: async () => {
      console.log('Fetching sala timing stats:', { fechaInicio, fechaFin, salaFiltro });
      
      // Obtener todos los datos quincenales en el rango de fechas
      const { data, error } = await supabase.rpc('obtener_estadisticas_quincenales_sala');
      
      if (error) {
        console.error('Error fetching timing stats:', error);
        throw error;
      }

      // Filtrar por fechas y sala
      const filteredData = data?.filter((item: SalaStatsData) => {
        const fechaItem = new Date(item.año, item.mes - 1, item.quincena === 1 ? 1 : 16);
        const dentroRango = fechaItem >= fechaInicio && fechaItem <= fechaFin;
        const cumpleSala = salaFiltro === 'todas' || item.sala_id === salaFiltro;
        
        return dentroRango && cumpleSala;
      }) || [];

      console.log('Filtered data:', filteredData);
      return filteredData;
    }
  });

  // Procesar datos para gráficos
  const datosProc = useMemo(() => {
    if (!estadisticas) return { porSala: [], timeline: [], resumen: [] };

    // Agrupar por sala
    const porSala = estadisticas.reduce((acc: any, item: SalaStatsData) => {
      const existing = acc.find((x: any) => x.sala === item.sala_nombre);
      if (existing) {
        existing.ingresos_tardios += item.minutos_ingresos_tardios;
        existing.cierres_prematuros += item.minutos_cierres_prematuros;
        existing.total_minutos += item.total_minutos;
        existing.total_incidencias_ingresos += item.total_incidencias_ingresos;
        existing.total_incidencias_cierres += item.total_incidencias_cierres;
      } else {
        acc.push({
          sala: item.sala_nombre,
          ingresos_tardios: item.minutos_ingresos_tardios,
          cierres_prematuros: item.minutos_cierres_prematuros,
          total_minutos: item.total_minutos,
          total_incidencias_ingresos: item.total_incidencias_ingresos,
          total_incidencias_cierres: item.total_incidencias_cierres
        });
      }
      return acc;
    }, []);

    // Timeline mensual
    const timeline = estadisticas.reduce((acc: any, item: SalaStatsData) => {
      const clave = `${item.año}-${item.mes.toString().padStart(2, '0')}`;
      const existing = acc.find((x: any) => x.periodo === clave);
      if (existing) {
        existing.total_minutos += item.total_minutos;
      } else {
        acc.push({
          periodo: clave,
          total_minutos: item.total_minutos,
          fecha: new Date(item.año, item.mes - 1, 1)
        });
      }
      return acc;
    }, []);

    // Datos para gráfico de torta
    const resumen = porSala.map((item: any) => ({
      name: item.sala,
      value: item.total_minutos,
      ingresos: item.ingresos_tardios,
      cierres: item.cierres_prematuros
    }));

    return { 
      porSala: porSala.sort((a: any, b: any) => b.total_minutos - a.total_minutos), 
      timeline: timeline.sort((a: any, b: any) => a.fecha - b.fecha),
      resumen 
    };
  }, [estadisticas]);

  const colores = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registro de Tiempos por Sala
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2">Cargando estadísticas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Registro de Tiempos por Sala
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {/* Filtros de Fecha */}
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Desde:</span>
              <Popover open={mostrarFechaInicio} onOpenChange={setMostrarFechaInicio}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fechaInicio, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={(fecha) => {
                      if (fecha) setFechaInicio(fecha);
                      setMostrarFechaInicio(false);
                    }}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Hasta:</span>
              <Popover open={mostrarFechaFin} onOpenChange={setMostrarFechaFin}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(fechaFin, "dd/MM/yyyy", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaFin}
                    onSelect={(fecha) => {
                      if (fecha) setFechaFin(fecha);
                      setMostrarFechaFin(false);
                    }}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtro de Sala */}
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Sala:</span>
              <Select value={salaFiltro} onValueChange={setSalaFiltro}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Todas las salas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las salas</SelectItem>
                  {salas?.map(sala => (
                    <SelectItem key={sala.id} value={sala.id}>
                      {sala.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Vista */}
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium">Vista:</span>
              <Select value={tipoVista} onValueChange={(value: any) => setTipoVista(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tabla">Tabla</SelectItem>
                  <SelectItem value="barras">Barras</SelectItem>
                  <SelectItem value="lineas">Líneas</SelectItem>
                  <SelectItem value="torta">Torta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenido Principal */}
      {tipoVista === 'tabla' && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Sala</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Sala</th>
                    <th className="text-center p-2">Ingresos Tardíos</th>
                    <th className="text-center p-2">Cierres Prematuros</th>
                    <th className="text-center p-2">Total Minutos</th>
                    <th className="text-center p-2">Total Incidencias</th>
                  </tr>
                </thead>
                <tbody>
                  {datosProc.porSala.map((item: any, index: number) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{item.sala}</td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className="text-blue-700">
                          {item.ingresos_tardios} min ({item.total_incidencias_ingresos})
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className="text-red-700">
                          {item.cierres_prematuros} min ({item.total_incidencias_cierres})
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        <Badge variant="outline" className="text-gray-700 font-bold">
                          {item.total_minutos} min
                        </Badge>
                      </td>
                      <td className="text-center p-2">
                        {item.total_incidencias_ingresos + item.total_incidencias_cierres}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tipoVista === 'barras' && (
        <Card>
          <CardHeader>
            <CardTitle>Minutos Acumulados por Sala</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ingresos_tardios: {
                  label: "Ingresos Tardíos",
                  color: "#3b82f6"
                },
                cierres_prematuros: {
                  label: "Cierres Prematuros", 
                  color: "#ef4444"
                }
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosProc.porSala}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sala" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ingresos_tardios" fill="#3b82f6" name="Ingresos Tardíos (min)" />
                  <Bar dataKey="cierres_prematuros" fill="#ef4444" name="Cierres Prematuros (min)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {tipoVista === 'lineas' && (
        <Card>
          <CardHeader>
            <CardTitle>Evolución Temporal de Minutos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total_minutos: {
                  label: "Total Minutos",
                  color: "#8884d8"
                }
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosProc.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="total_minutos" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {tipoVista === 'torta' && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Minutos por Sala</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{}}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosProc.resumen}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.name}: ${entry.value}min`}
                  >
                    {datosProc.resumen.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalaTimingModule;
