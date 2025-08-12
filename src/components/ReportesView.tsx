import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Filter, Eye, Image as ImageIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportToPDF } from "@/utils/pdfExport";
import { toast } from "sonner";

const ReportesView = () => {
  const { isAdmin, isRRHH, isFinanzas, isSupervisorSalas, isMantenimiento } = useAuth();
  
  // Mapeo de roles a nombres de áreas
  const roleAreaMapping = useMemo(() => ({
    rrhh: "Recursos Humanos",
    finanzas: "Finanzas", 
    supervisor_salas: "Salas",
    mantenimiento: "Mantenimiento"
  }), []);

  // Obtener el área correspondiente al rol del usuario
  const userAreaName = useMemo(() => {
    if (isRRHH) return roleAreaMapping.rrhh;
    if (isFinanzas) return roleAreaMapping.finanzas;
    if (isSupervisorSalas) return roleAreaMapping.supervisor_salas;
    if (isMantenimiento) return roleAreaMapping.mantenimiento;
    return null;
  }, [isRRHH, isFinanzas, isSupervisorSalas, isMantenimiento, roleAreaMapping]);

  const [filtros, setFiltros] = useState({
    fechaInicio: "",
    fechaFin: "",
    area: "all",
    clasificacion: "all",
    prioridad: "all"
  });

  // Obtener áreas para el filtro
  const { data: areas } = useQuery({
    queryKey: ["departamentos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("departamentos")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      return data || [];
    },
  });

  // Obtener clasificaciones para el filtro
  const { data: clasificaciones } = useQuery({
    queryKey: ["clasificaciones"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clasificaciones")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      return data || [];
    },
  });

  // Obtener incidencias filtradas - SOLO APROBADAS
  const { data: incidencias, isLoading, refetch } = useQuery({
    queryKey: ["incidencias-filtradas", filtros],
    queryFn: async () => {
      console.log("Fetching filtered incidencias with filters:", filtros);
      
      let query = supabase
        .from("incidencias")
        .select(`
          *,
          departamentos(nombre, descripcion),
          clasificaciones(nombre, color),
          imagenes_incidencias(id, url_imagen, nombre_archivo)
        `)
        .eq("estado", "aprobado") // Solo incidencias aprobadas
        .order("created_at", { ascending: false });

      // Aplicar filtros
      if (filtros.fechaInicio) {
        query = query.gte("fecha_incidencia", filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte("fecha_incidencia", filtros.fechaFin);
      }
      if (filtros.area && filtros.area !== "all") {
        query.eq("departamento_id", filtros.area);
      }
      if (filtros.clasificacion && filtros.clasificacion !== "all") {
        query.eq("clasificacion_id", filtros.clasificacion);
      }
      if (filtros.prioridad && filtros.prioridad !== "all") {
        query.eq("prioridad", filtros.prioridad);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching incidencias:", error);
        throw error;
      }

      let filteredData = data || [];

      // Filtrar por área según el rol del usuario (solo si no es admin)
      if (!isAdmin && userAreaName) {
        filteredData = filteredData.filter(incidencia => 
          incidencia.departamentos?.nombre === userAreaName
        );
      }

      // Obtener información de perfiles para los usuarios reportadores
      const uniqueUserIds = [...new Set(filteredData
        .map(inc => inc.reportado_por)
        .filter(id => id && id.length === 36))] as string[]; // Solo UUIDs válidos

      let profilesMap: Record<string, any> = {};
      
      if (uniqueUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", uniqueUserIds);
          
        if (profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Enriquecer datos con información de perfiles
      const enrichedData = filteredData.map(incidencia => ({
        ...incidencia,
        reportado_por_profile: profilesMap[incidencia.reportado_por] || null
      }));

      console.log("Filtered incidencias:", enrichedData);
      return enrichedData;
    },
  });

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: "",
      fechaFin: "",
      area: "all",
      clasificacion: "all",
      prioridad: "all"
    });
  };

  const exportarCSV = () => {
    if (!incidencias || incidencias.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    const csv = [
      ["Título", "Área", "Clasificación", "Prioridad", "Reportado por", "Fecha", "Descripción"].join(","),
      ...incidencias.map(inc => [
        `"${inc.titulo}"`,
        `"${inc.departamentos?.nombre || ''}"`,
        `"${inc.clasificaciones?.nombre || ''}"`,
        `"${inc.prioridad}"`,
        `"${inc.reportado_por_profile?.full_name || inc.reportado_por_profile?.email || inc.reportado_por}"`,
        `"${format(new Date(inc.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es })}"`,
        `"${inc.descripcion}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_incidencias_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Reporte CSV exportado correctamente");
  };

  const exportarPDF = () => {
    if (!incidencias || incidencias.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      exportToPDF(incidencias, filtros);
      toast.success("Reporte PDF exportado correctamente");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Error al exportar el PDF");
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "critica": return "bg-red-500";
      case "alta": return "bg-orange-500";
      case "media": return "bg-yellow-500";
      case "baja": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel de filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
          <CardDescription>
            Utiliza los filtros para generar reportes específicos de incidencias aprobadas del sistema de monitoreo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => handleFiltroChange("fechaInicio", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => handleFiltroChange("fechaFin", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Área</Label>
              <Select 
                value={filtros.area} 
                onValueChange={(value) => handleFiltroChange("area", value)}
                disabled={!isAdmin && !!userAreaName} // Deshabilitar si no es admin y tiene área específica
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !isAdmin && userAreaName 
                      ? `Área: ${userAreaName}` 
                      : "Todas las áreas"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="all">Todas las áreas</SelectItem>}
                  {areas?.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isAdmin && userAreaName && (
                <p className="text-xs text-gray-500">
                  Solo puedes ver incidencias de tu área: {userAreaName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Incidencia</Label>
              <Select value={filtros.clasificacion} onValueChange={(value) => handleFiltroChange("clasificacion", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {clasificaciones?.map((clasificacion) => (
                    <SelectItem key={clasificacion.id} value={clasificacion.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: clasificacion.color }}
                        />
                        {clasificacion.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={filtros.prioridad} onValueChange={(value) => handleFiltroChange("prioridad", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={limpiarFiltros} variant="outline">
              Limpiar Filtros
            </Button>
            <Button onClick={exportarCSV} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={exportarPDF} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reporte de Incidencias Aprobadas - Monitoreo de Salas</span>
            <Badge variant="secondary">
              {incidencias?.length || 0} incidencias encontradas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : incidencias && incidencias.length > 0 ? (
            <div className="space-y-4">
              {incidencias.map((incidencia) => (
                <Card key={incidencia.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{incidencia.titulo}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">
                            {incidencia.departamentos?.nombre}
                          </Badge>
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: incidencia.clasificaciones?.color,
                              color: incidencia.clasificaciones?.color 
                            }}
                          >
                            {incidencia.clasificaciones?.nombre}
                          </Badge>
                          <Badge className={`text-white ${getPrioridadColor(incidencia.prioridad)}`}>
                            {incidencia.prioridad}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{format(new Date(incidencia.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                        <p>Por: {incidencia.reportado_por_profile?.full_name || incidencia.reportado_por_profile?.email || incidencia.reportado_por}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{incidencia.descripcion}</p>
                    
                    {incidencia.observaciones && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <strong>Observaciones:</strong> {incidencia.observaciones}
                      </div>
                    )}

                    {incidencia.imagenes_incidencias && incidencia.imagenes_incidencias.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ImageIcon className="h-4 w-4" />
                        <span>{incidencia.imagenes_incidencias.length} imagen(es) adjunta(s)</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600">No se encontraron incidencias aprobadas con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportesView;
