
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Search, RotateCcw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface ReportFiltersProps {
  areas: any[];
  clasificaciones: any[];
  onFiltersChange: (filters: any) => void;
}

const ReportFilters = ({ areas, clasificaciones, onFiltersChange }: ReportFiltersProps) => {
  const [filtros, setFiltros] = useState({
    fechaInicio: null as Date | null,
    fechaFin: null as Date | null,
    area_id: "",
    clasificacion_id: "",
    prioridad: "",
    buscarTexto: ""
  });

  const [mostrarFechaInicio, setMostrarFechaInicio] = useState(false);
  const [mostrarFechaFin, setMostrarFechaFin] = useState(false);

  const handleFiltroChange = (campo: string, valor: any) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
    aplicarFiltros(nuevosFiltros);
  };

  const aplicarFiltros = (filtrosActuales: any) => {
    const filtrosFormateados: any = {};

    // Filtro de texto
    if (filtrosActuales.buscarTexto?.trim()) {
      filtrosFormateados.buscarTexto = filtrosActuales.buscarTexto.trim();
    }

    // Filtros de selección
    if (filtrosActuales.area_id) {
      filtrosFormateados.area_id = filtrosActuales.area_id;
    }

    if (filtrosActuales.clasificacion_id) {
      filtrosFormateados.clasificacion_id = filtrosActuales.clasificacion_id;
    }

    if (filtrosActuales.prioridad) {
      filtrosFormateados.prioridad = filtrosActuales.prioridad;
    }

    // Filtros de fecha - convertir a ISO string con zona horaria
    if (filtrosActuales.fechaInicio) {
      filtrosFormateados.fechaInicio = startOfDay(filtrosActuales.fechaInicio).toISOString();
    }

    if (filtrosActuales.fechaFin) {
      filtrosFormateados.fechaFin = endOfDay(filtrosActuales.fechaFin).toISOString();
    }

    console.log("Aplicando filtros:", filtrosFormateados);
    onFiltersChange(filtrosFormateados);
  };

  const limpiarFiltros = () => {
    const filtrosLimpios = {
      fechaInicio: null,
      fechaFin: null,
      area_id: "",
      clasificacion_id: "",
      prioridad: "",
      buscarTexto: ""
    };
    setFiltros(filtrosLimpios);
    onFiltersChange({});
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold">Filtros de Búsqueda</h3>
      </div>

      {/* Filtro de texto */}
      <div className="space-y-2">
        <Label htmlFor="buscar">Buscar en título o descripción</Label>
        <Input
          id="buscar"
          placeholder="Buscar en incidencias..."
          value={filtros.buscarTexto}
          onChange={(e) => handleFiltroChange("buscarTexto", e.target.value)}
        />
      </div>

      {/* Filtros de fecha */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha inicio</Label>
          <Popover open={mostrarFechaInicio} onOpenChange={setMostrarFechaInicio}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filtros.fechaInicio ? (
                  format(filtros.fechaInicio, "dd/MM/yyyy", { locale: es })
                ) : (
                  "Seleccionar fecha"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filtros.fechaInicio || undefined}
                onSelect={(fecha) => {
                  handleFiltroChange("fechaInicio", fecha);
                  setMostrarFechaInicio(false);
                }}
                locale={es}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Fecha fin</Label>
          <Popover open={mostrarFechaFin} onOpenChange={setMostrarFechaFin}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filtros.fechaFin ? (
                  format(filtros.fechaFin, "dd/MM/yyyy", { locale: es })
                ) : (
                  "Seleccionar fecha"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filtros.fechaFin || undefined}
                onSelect={(fecha) => {
                  handleFiltroChange("fechaFin", fecha);
                  setMostrarFechaFin(false);
                }}
                locale={es}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filtros de selección */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Área</Label>
          <Select value={filtros.area_id} onValueChange={(value) => handleFiltroChange("area_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las áreas</SelectItem>
              {areas?.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Clasificación</Label>
          <Select value={filtros.clasificacion_id} onValueChange={(value) => handleFiltroChange("clasificacion_id", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las clasificaciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las clasificaciones</SelectItem>
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
          <Label>Prioridad</Label>
          <Select value={filtros.prioridad} onValueChange={(value) => handleFiltroChange("prioridad", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las prioridades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las prioridades</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botón para limpiar filtros */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={limpiarFiltros} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
};

export default ReportFilters;
