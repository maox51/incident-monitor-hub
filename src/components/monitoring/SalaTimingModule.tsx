
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, RefreshCw, Clock, BarChart3 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const SalaTimingModule = () => {
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfMonth(new Date()));
  const [fechaFin, setFechaFin] = useState<Date>(endOfMonth(new Date()));
  const [salaFiltro, setSalaFiltro] = useState<string>('todas');
  const [tipoVista, setTipoVista] = useState<'tabla' | 'barras' | 'lineas' | 'torta'>('tabla');
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
      return data || [];
    }
  });

  // Obtener incidencias de tiempo
  const { data: incidencias, isLoading, refetch } = useQuery({
    queryKey: ['sala-timing-incidencias', fechaInicio, fechaFin, salaFiltro],
    queryFn: async () => {
      console.log('Fetching timing incidencias:', { fechaInicio, fechaFin, salaFiltro });
      
      let query = supabase
        .from('incidencias')
        .select(`
          id,
          fecha_incidencia,
          tiempo_minutos,
          clasificacion:clasificaciones(nombre),
          sala:salas(nombre, id)
        `)
        .gte('fecha_incidencia', fechaInicio.toISOString().split('T')[0])
        .lte('fecha_incidencia', fechaFin.toISOString().split('T')[0])
        .not('tiempo_minutos', 'is', null)
        .gt('tiempo_minutos', 0)
        .eq('aprobado', true);

      if (salaFiltro !== 'todas') {
        query = query.eq('sala_id', salaFiltro);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching timing incidencias:', error);
        throw error;
      }

      console.log('Timing incidencias data:', data);
      return data || [];
    }
  });

  // Procesar datos para gráficos
  const datosProc = useMemo(() => {
    if (!incidencias || !Array.isArray(incidencias)) return { porSala: [], timeline: [], resumen: [] };

    // Filtrar incidencias de tiempo (ingresos tardíos y cierres prematuros)
    const incidenciasTiempo = incidencias.filter((inc: any) => {
      const clasificacion = inc.clasificacion;
      if (!clasificacion || !clasificacion.nombre) return false;
      
      const nombreClasif = clasificacion.nombre.toLowerCase();
      return nombreClasif.includes('ingreso tardio') ||
             nombreClasif.includes('cierre prematuro') ||
             nombreClasif.includes('tardio') ||
             nombreClasif.includes('prematuro');
    });

    // Agrupar por sala
    const porSalaMap = new Map();
    
    incidenciasTiempo.forEach((inc: any) => {
      const salaNombre = inc.sala?.nombre || 'Sin Sala';
      const clasificacionNombre = inc.clasificacion?.nombre?.toLowerCase() || '';
      const esIngreso = clasificacionNombre.includes('ingreso') || clasificacionNombre.includes('tardio');
      
      if (!porSalaMap.has(salaNombre)) {
        porSalaMap.set(salaNombre, {
          sala: salaNombre,
          ingresos_tardios: 0,
          cierres_prematuros: 0,
          total_incidencias_ingresos: 0,
          total_incidencias_cierres: 0,
          total_minutos: 0
        });
      }
      
      const salaData = porSalaMap.get(salaNombre);
      const minutos = inc.tiempo_minutos || 0;
      
      if (esIngreso) {
        salaData.ingresos_tardios += minutos;
        salaData.total_incidencias_ingresos += 1;
      } else {
        salaData.cierres_prematuros += minutos;
        salaData.total_incidencias_cierres += 1;
      }
      
      salaData.total_minutos += minutos;
    });

    const porSala = Array.from(porSalaMap.values()).sort((a: any, b: any) => b.total_minutos - a.total_minutos);

    // Timeline mensual
    const timelineMap = new Map();
    incidenciasTiempo.forEach((inc: any) => {
      const fecha = new Date(inc.fecha_incidencia);
      const clave = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!timelineMap.has(clave)) {
        timelineMap.set(clave, {
          periodo: clave,
          total_minutos: 0,
          fecha: new Date(fecha.getFullYear(), fecha.getMonth(), 1)
        });
      }
      
      timelineMap.get(clave).total_minutos += inc.tiempo_minutos || 0;
    });

    const timeline = Array.from(timelineMap.values()).sort((a: any, b: any) => a.fecha.getTime() - b.fecha.getTime());

    // Datos para gráfico de torta
    const resumen = porSala.map((item: any) => ({
      name: item.sala,
      value: item.total_minutos,
      ingresos: item.ingresos_tardios,
      cierres: item.cierres_prematuros
    }));

    return { porSala, timeline, resumen };
  }, [incidencias]);

  const colores = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Monitoreo de Tiempos por Sala
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2">Cargando datos...</span>
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
            Monitoreo de Tiempos por Sala
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
                  {salas?.map((sala: any) => (
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

      {/* Resumen de datos */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{datosProc.porSala.reduce((acc: number, curr: any) => acc + curr.total_incidencias_ingresos, 0)}</p>
              <p className="text-sm text-gray-600">Total Ingresos Tardíos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{datosProc.porSala.reduce((acc: number, curr: any) => acc + curr.total_incidencias_cierres, 0)}</p>
              <p className="text-sm text-gray-600">Total Cierres Prematuros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{datosProc.porSala.reduce((acc: number, curr: any) => acc + curr.total_minutos, 0)}</p>
              <p className="text-sm text-gray-600">Minutos Totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{datosProc.porSala.length}</p>
              <p className="text-sm text-gray-600">Salas Afectadas</p>
            </div>
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
            {datosProc.porSala.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No se encontraron datos de tiempo para el período seleccionado</p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      )}

      {tipoVista === 'barras' && (
        <Card>
          <CardHeader>
            <CardTitle>Minutos Acumulados por Sala</CardTitle>
          </CardHeader>
          <CardContent>
            {datosProc.porSala.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      )}

      {tipoVista === 'lineas' && (
        <Card>
          <CardHeader>
            <CardTitle>Evolución Temporal de Minutos</CardTitle>
          </CardHeader>
          <CardContent>
            {datosProc.timeline.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos temporales para mostrar</p>
            ) : (
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
            )}
          </CardContent>
        </Card>
      )}

      {tipoVista === 'torta' && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Minutos por Sala</CardTitle>
          </CardHeader>
          <CardContent>
            {datosProc.resumen.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos para distribución</p>
            ) : (
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
                      label={(entry: any) => `${entry.name}: ${entry.value}min`}
                    >
                      {datosProc.resumen.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalaTimingModule;
