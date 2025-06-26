
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Camera, Building } from "lucide-react";

interface Area {
  id: string;
  nombre: string;
}

interface Clasificacion {
  id: string;
  nombre: string;
  color: string;
}

interface Sala {
  id: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  numero_camaras?: number;
}

interface FormData {
  titulo: string;
  descripcion: string;
  observaciones: string;
  area_id: string;
  clasificacion_id: string;
  prioridad: string;
  reportado_por: string;
  sala_id: string;
}

interface IncidentFormFieldsProps {
  formData: FormData;
  areas?: Area[];
  clasificaciones?: Clasificacion[];
  salas?: Sala[];
  onInputChange: (field: string, value: string) => void;
}

const IncidentFormFields = ({ formData, areas, clasificaciones, salas, onInputChange }: IncidentFormFieldsProps) => {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            value={formData.titulo}
            onChange={(e) => onInputChange("titulo", e.target.value)}
            placeholder="Título descriptivo de la incidencia"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="reportado_por">Reportado por *</Label>
          <Input
            id="reportado_por"
            value={formData.reportado_por}
            onChange={(e) => onInputChange("reportado_por", e.target.value)}
            placeholder="Nombre del reportante"
            required
            className="bg-blue-50 border-blue-200"
            disabled
          />
          <p className="text-xs text-blue-600">Capturado automáticamente del usuario logueado</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="sala" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Sucursal Casino *
          </Label>
          <Select value={formData.sala_id} onValueChange={(value) => onInputChange("sala_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una sucursal" />
            </SelectTrigger>
            <SelectContent>
              {salas?.map((sala) => (
                <SelectItem key={sala.id} value={sala.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{sala.nombre}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {sala.ubicacion}
                      <Camera className="w-3 h-3 ml-2" />
                      {sala.numero_camaras} cámaras
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clasificacion">Tipo de Incidencia * (Selecciona primero)</Label>
          <Select value={formData.clasificacion_id} onValueChange={(value) => onInputChange("clasificacion_id", value)}>
            <SelectTrigger className="border-orange-200 bg-orange-50">
              <SelectValue placeholder="Selecciona el tipo de incidencia" />
            </SelectTrigger>
            <SelectContent>
              {clasificaciones?.map((clasificacion) => (
                <SelectItem key={clasificacion.id} value={clasificacion.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: clasificacion.color || '#6B7280' }}
                    />
                    {clasificacion.nombre}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-orange-600">El sistema seleccionará automáticamente el área correspondiente</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="area">Área (Auto-seleccionada)</Label>
          <Select value={formData.area_id} onValueChange={(value) => onInputChange("area_id", value)}>
            <SelectTrigger className="bg-green-50 border-green-200">
              <SelectValue placeholder="Se seleccionará automáticamente" />
            </SelectTrigger>
            <SelectContent>
              {areas?.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-green-600">Seleccionada automáticamente según tipo de incidencia</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prioridad">Prioridad (Auto-sugerida)</Label>
          <Select value={formData.prioridad} onValueChange={(value) => onInputChange("prioridad", value)}>
            <SelectTrigger className="bg-purple-50 border-purple-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baja">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Baja
                </div>
              </SelectItem>
              <SelectItem value="media">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  Media
                </div>
              </SelectItem>
              <SelectItem value="alta">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Alta
                </div>
              </SelectItem>
              <SelectItem value="critica">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Crítica
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-purple-600">Sugerida automáticamente según tipo de incidencia</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => onInputChange("descripcion", e.target.value)}
          placeholder="Describe detalladamente la incidencia"
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          value={formData.observaciones}
          onChange={(e) => onInputChange("observaciones", e.target.value)}
          placeholder="Observaciones adicionales (opcional)"
          rows={3}
        />
      </div>
    </>
  );
};

export default IncidentFormFields;
