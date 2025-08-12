
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, User, Calendar, MapPin, AlertTriangle, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const BorradoresView = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  // Verificar permisos
  if (!profile || (profile.role !== 'supervisor_monitoreo' && profile.role !== 'admin')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso Restringido</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Solo los supervisores de monitoreo y administradores pueden acceder a esta sección.</p>
        </CardContent>
      </Card>
    );
  }

  // Obtener incidencias en borrador
  const { data: borradores, isLoading, refetch } = useQuery({
    queryKey: ["incidencias-borradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidencias")
        .select(`
          *,
          departamentos(nombre, descripcion),
          clasificaciones(nombre, color),
          incidencia_clasificaciones(
            id,
            clasificaciones(id, nombre, color)
          ),
          imagenes_incidencias(id, url_imagen, nombre_archivo, tipo_archivo)
        `)
        .eq("estado", "borrador")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching borradores:", error);
        throw error;
      }

      return data || [];
    },
  });

  // Obtener datos para los selects de edición
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

  const { data: salas } = useQuery({
    queryKey: ["salas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("salas")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      return data || [];
    },
  });

  // Función para editar incidencia
  const editarIncidencia = useMutation({
    mutationFn: async ({ incidenciaId, updatedData }: { incidenciaId: string; updatedData: any }) => {
      const { data, error } = await supabase
        .from("incidencias")
        .update(updatedData)
        .eq("id", incidenciaId)
        .eq("estado", "borrador")
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Incidencia actualizada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["incidencias-borradores"] });
      setEditingId(null);
      setEditData({});
    },
    onError: (error) => {
      console.error("Error editando incidencia:", error);
      toast.error("Error al actualizar la incidencia");
    }
  });

  // Función para aprobar/rechazar incidencia
  const aprobarIncidencia = useMutation({
    mutationFn: async ({ incidenciaId, nuevoEstado }: { incidenciaId: string; nuevoEstado: string }) => {
      const { data, error } = await supabase.rpc('aprobar_incidencia', {
        incidencia_id: incidenciaId,
        nuevo_estado: nuevoEstado
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      const accion = variables.nuevoEstado === 'aprobado' ? 'aprobada' : 'rechazada';
      toast.success(`Incidencia ${accion} exitosamente`);
      queryClient.invalidateQueries({ queryKey: ["incidencias-borradores"] });
      setProcessingId(null);
    },
    onError: (error) => {
      console.error("Error procesando incidencia:", error);
      toast.error("Error al procesar la incidencia");
      setProcessingId(null);
    }
  });

  const handleApproval = (incidenciaId: string, nuevoEstado: string) => {
    setProcessingId(incidenciaId);
    aprobarIncidencia.mutate({ incidenciaId, nuevoEstado });
  };

  const handleEdit = (incidencia: any) => {
    setEditingId(incidencia.id);
    setEditData({
      titulo: incidencia.titulo,
      descripcion: incidencia.descripcion,
      departamento_id: incidencia.departamento_id,
      clasificacion_id: incidencia.clasificacion_id,
      sala_id: incidencia.sala_id,
      prioridad: incidencia.prioridad,
      observaciones: incidencia.observaciones || '',
      tiempo_minutos: incidencia.tiempo_minutos || 0
    });
  };

  const handleSaveEdit = (incidenciaId: string) => {
    editarIncidencia.mutate({ incidenciaId, updatedData: editData });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Incidencias Pendientes de Aprobación
          </CardTitle>
          <CardDescription>
            Revisa, edita si es necesario y aprueba las incidencias creadas por los monitores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary">
              {borradores?.length || 0} incidencias pendientes
            </Badge>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {borradores && borradores.length > 0 ? (
        <div className="space-y-4">
          {borradores.map((incidencia) => (
            <Card key={incidencia.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                {editingId === incidencia.id ? (
                  // Modo edición
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Título</label>
                        <Input
                          value={editData.titulo || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, titulo: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Prioridad</label>
                        <Select 
                          value={editData.prioridad || ''} 
                          onValueChange={(value) => setEditData(prev => ({ ...prev, prioridad: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="critica">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Área</label>
                        <Select 
                          value={editData.departamento_id || ''} 
                          onValueChange={(value) => setEditData(prev => ({ ...prev, departamento_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {areas?.map((area) => (
                              <SelectItem key={area.id} value={area.id}>
                                {area.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Clasificación</label>
                        <Select 
                          value={editData.clasificacion_id || ''} 
                          onValueChange={(value) => setEditData(prev => ({ ...prev, clasificacion_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {clasificaciones?.map((clasificacion) => (
                              <SelectItem key={clasificacion.id} value={clasificacion.id}>
                                {clasificacion.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Sala</label>
                        <Select 
                          value={editData.sala_id || ''} 
                          onValueChange={(value) => setEditData(prev => ({ ...prev, sala_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {salas?.map((sala) => (
                              <SelectItem key={sala.id} value={sala.id}>
                                {sala.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tiempo (minutos)</label>
                        <Input
                          type="number"
                          value={editData.tiempo_minutos || 0}
                          onChange={(e) => setEditData(prev => ({ ...prev, tiempo_minutos: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Descripción</label>
                      <Textarea
                        value={editData.descripcion || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Observaciones</label>
                      <Textarea
                        value={editData.observaciones || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, observaciones: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveEdit(incidencia.id)} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Modo vista
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{incidencia.titulo}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">
                            <MapPin className="w-3 h-3 mr-1" />
                            {incidencia.departamentos?.nombre}
                          </Badge>
                          {/* Mostrar todas las clasificaciones */}
                          {incidencia.incidencia_clasificaciones && incidencia.incidencia_clasificaciones.length > 0 ? (
                            incidencia.incidencia_clasificaciones.map((relacion: any) => (
                              <Badge 
                                key={relacion.id}
                                variant="outline"
                                style={{ 
                                  borderColor: relacion.clasificaciones?.color,
                                  color: relacion.clasificaciones?.color 
                                }}
                              >
                                {relacion.clasificaciones?.nombre}
                              </Badge>
                            ))
                          ) : (
                            // Fallback para incidencias existentes con clasificación única
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: incidencia.clasificaciones?.color,
                                color: incidencia.clasificaciones?.color 
                              }}
                            >
                              {incidencia.clasificaciones?.nombre}
                            </Badge>
                          )}
                          <Badge className={`text-white ${getPrioridadColor(incidencia.prioridad)}`}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {incidencia.prioridad}
                          </Badge>
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            Borrador
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(incidencia.fecha_incidencia), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                        <p className="flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" />
                          ID: {incidencia.reportado_por}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{incidencia.descripcion}</p>
                    
                    {incidencia.observaciones && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <strong>Observaciones:</strong> {incidencia.observaciones}
                      </div>
                    )}

                    {incidencia.tiempo_minutos && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-3">
                        <strong>Tiempo reportado:</strong> {incidencia.tiempo_minutos} minutos
                      </div>
                    )}

                    {incidencia.imagenes_incidencias && incidencia.imagenes_incidencias.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Evidencia multimedia ({incidencia.imagenes_incidencias.length} archivos)
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {incidencia.imagenes_incidencias.map((imagen) => {
                            const isVideo = imagen.tipo_archivo?.startsWith('video/');
                            return (
                              <div key={imagen.id} className="relative">
                                {isVideo ? (
                                  <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center">
                                    <span className="text-xs text-gray-500">Video</span>
                                  </div>
                                ) : (
                                  <img
                                    src={imagen.url_imagen}
                                    alt="Evidencia"
                                    className="w-full h-16 object-cover rounded"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleEdit(incidencia)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleApproval(incidencia.id, 'aprobado')}
                        disabled={processingId === incidencia.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {processingId === incidencia.id ? 'Procesando...' : 'Aprobar'}
                      </Button>
                      <Button
                        onClick={() => handleApproval(incidencia.id, 'rechazado')}
                        disabled={processingId === incidencia.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {processingId === incidencia.id ? 'Procesando...' : 'Rechazar'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-gray-600">No hay incidencias pendientes de aprobación</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BorradoresView;
