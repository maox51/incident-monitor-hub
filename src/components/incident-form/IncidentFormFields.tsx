
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Area {
  id: string;
  nombre: string;
}

interface Clasificacion {
  id: string;
  nombre: string;
  color: string;
}

interface FormData {
  titulo: string;
  descripcion: string;
  observaciones: string;
  area_id: string;
  clasificacion_id: string;
  prioridad: string;
  reportado_por: string;
}

interface IncidentFormFieldsProps {
  formData: FormData;
  areas?: Area[];
  clasificaciones?: Clasificacion[];
  onInputChange: (field: string, value: string) => void;
}

const IncidentFormFields = ({ formData, areas, clasificaciones, onInputChange }: IncidentFormFieldsProps) => {
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
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="area">Área *</Label>
          <Select value={formData.area_id} onValueChange={(value) => onInputChange("area_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un área" />
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

        <div className="space-y-2">
          <Label htmlFor="clasificacion">Clasificación *</Label>
          <Select value={formData.clasificacion_id} onValueChange={(value) => onInputChange("clasificacion_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una clasificación" />
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="prioridad">Prioridad</Label>
          <Select value={formData.prioridad} onValueChange={(value) => onInputChange("prioridad", value)}>
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
