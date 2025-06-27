
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, FileText, Image as ImageIcon, Video, Eye, AlertTriangle, Users, Building } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

// Definir interfaces más específicas
interface IncidenciaImagen {
  id: string;
  url: string;
  nombre: string;
  tipo: string;
  es_video: boolean;
}

interface IncidenciaDetalle {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  area: string;
  sala: string;
  reportado_por: string;
  fecha_incidencia: string;
  imagenes: IncidenciaImagen[];
  total_archivos: number;
}

interface EstadisticasMultimedia {
  resumen_multimedia: {
    total_imagenes: number;
    total_videos: number;
    incidencias_con_evidencia: number;
  };
}

interface ConsolidadoDetallado {
  id: string;
  fecha_reporte: string;
  total_incidencias: number;
  incidencias_criticas: number;
  incidencias_altas: number;
  incidencias_medias: number;
  incidencias_bajas: number;
  areas_afectadas: number;
  salas_afectadas: number;
  incidencias_detalle: IncidenciaDetalle[];
  estadisticas_multimedia?: EstadisticasMultimedia;
}

const ConsolidadoDiario = () => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Obtener consolidado detallado con tipo de retorno correcto
  const { data: consolidado, isLoading, refetch } = useQuery({
    queryKey: ["consolidado-detallado", fechaSeleccionada],
    queryFn: async (): Promise<ConsolidadoDetallado | null> => {
      console.log("Fetching consolidado for date:", fechaSeleccionada);
      
      const { data, error } = await supabase
        .rpc('obtener_consolidado_con_medios', { fecha_consolidado: fechaSeleccionada });

      if (error) {
        console.error("Error fetching consolidado:", error);
        throw error;
      }

      console.log("Raw consolidado data:", data);
      
      // Si no hay datos, retornar null
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return null;
      }

      // Convertir el JSON a nuestro tipo esperado
      const consolidadoData = typeof data === 'string' ? JSON.parse(data) : data;
      
      return {
        id: consolidadoData.id || '',
        fecha_reporte: consolidadoData.fecha_reporte || fechaSeleccionada,
        total_incidencias: consolidadoData.total_incidencias || 0,
        incidencias_criticas: consolidadoData.incidencias_criticas || 0,
        incidencias_altas: consolidadoData.incidencias_altas || 0,
        incidencias_medias: consolidadoData.incidencias_medias || 0,
        incidencias_bajas: consolidadoData.incidencias_bajas || 0,
        areas_afectadas: consolidadoData.areas_afectadas || 0,
        salas_afectadas: consolidadoData.salas_afectadas || 0,
        incidencias_detalle: Array.isArray(consolidadoData.incidencias_detalle) 
          ? consolidadoData.incidencias_detalle 
          : [],
        estadisticas_multimedia: consolidadoData.estadisticas_multimedia || {
          resumen_multimedia: {
            total_imagenes: 0,
            total_videos: 0,
            incidencias_con_evidencia: 0
          }
        }
      };
    },
  });

  const generarConsolidado = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('daily-consolidation', {
        body: { fecha: fechaSeleccionada }
      });

      if (error) throw error;

      toast.success("Consolidado generado exitosamente");
      refetch();
    } catch (error) {
      console.error("Error generating consolidado:", error);
      toast.error("Error al generar el consolidado");
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "critica": return "bg-red-500 text-white";
      case "alta": return "bg-orange-500 text-white";
      case "media": return "bg-yellow-500 text-white";
      case "baja": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const MediaViewer = ({ archivo }: { archivo: IncidenciaImagen }) => {
    if (archivo.es_video) {
      return (
        <div className="relative group">
          <video
            src={archivo.url}
            className="w-full h-32 object-cover rounded-lg"
            controls
            preload="metadata"
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 rounded-full p-1">
            <Video className="w-4 h-4 text-white" />
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative group">
          <img
            src={archivo.url}
            alt={archivo.nombre}
            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.open(archivo.url, '_blank')}
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 rounded-full p-1">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-3 h-3 inline mr-1" />
            Ver
          </div>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Consolidado Diario de Incidencias
          </CardTitle>
          <CardDescription>
            Reporte automático generado diariamente a las 21:00 horas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha del consolidado</Label>
              <Input
                id="fecha"
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button onClick={generarConsolidado} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Generar Consolidado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen del consolidado */}
      {consolidado && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Resumen del {format(new Date(consolidado.fecha_reporte), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{consolidado.total_incidencias}</div>
                  <div className="text-sm text-gray-600">Total Incidencias</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{consolidado.incidencias_criticas}</div>
                  <div className="text-sm text-gray-600">Críticas</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{consolidado.areas_afectadas}</div>
                  <div className="text-sm text-gray-600">Áreas Afectadas</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{consolidado.salas_afectadas}</div>
                  <div className="text-sm text-gray-600">Sucursales Afectadas</div>
                </div>
              </div>

              {/* Estadísticas multimedia */}
              {consolidado.estadisticas_multimedia && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Evidencia Multimedia
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {consolidado.estadisticas_multimedia.resumen_multimedia.total_imagenes}
                      </div>
                      <div className="text-xs text-gray-600">Imágenes</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {consolidado.estadisticas_multimedia.resumen_multimedia.total_videos}
                      </div>
                      <div className="text-xs text-gray-600">Videos</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">
                        {consolidado.estadisticas_multimedia.resumen_multimedia.incidencias_con_evidencia}
                      </div>
                      <div className="text-xs text-gray-600">Con Evidencia</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Distribución de prioridades */}
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-red-500 text-white">
                  Críticas: {consolidado.incidencias_criticas}
                </Badge>
                <Badge className="bg-orange-500 text-white">
                  Altas: {consolidado.incidencias_altas}
                </Badge>
                <Badge className="bg-yellow-500 text-white">
                  Medias: {consolidado.incidencias_medias}
                </Badge>
                <Badge className="bg-green-500 text-white">
                  Bajas: {consolidado.incidencias_bajas}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Detalle de incidencias */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Incidencias</CardTitle>
              <CardDescription>
                Listado completo de incidencias del día con evidencia multimedia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consolidado.incidencias_detalle.length > 0 ? (
                <div className="space-y-4">
                  {consolidado.incidencias_detalle.map((incidencia) => (
                    <Card key={incidencia.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-1">{incidencia.titulo}</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge className={getPrioridadColor(incidencia.prioridad)}>
                                {incidencia.prioridad}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {incidencia.area}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {incidencia.sala}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{format(new Date(incidencia.fecha_incidencia), 'HH:mm', { locale: es })}</p>
                            <p>Por: {incidencia.reportado_por}</p>
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3">{incidencia.descripcion}</p>

                        {/* Multimedia */}
                        {incidencia.imagenes && incidencia.imagenes.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <ImageIcon className="w-4 h-4" />
                              Evidencia Multimedia ({incidencia.total_archivos} archivos)
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {incidencia.imagenes.map((archivo) => (
                                <div key={archivo.id} className="space-y-1">
                                  <MediaViewer archivo={archivo} />
                                  <p className="text-xs text-gray-500 truncate" title={archivo.nombre}>
                                    {archivo.nombre}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(!incidencia.imagenes || incidencia.imagenes.length === 0) && (
                          <div className="text-sm text-gray-500 italic">
                            Sin evidencia multimedia adjunta
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">No hay incidencias registradas para esta fecha</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!consolidado && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600">No hay consolidado disponible para esta fecha</p>
              <Button onClick={generarConsolidado} className="mt-4">
                Generar Consolidado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ConsolidadoDiario;
