import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSolicitudes, type Solicitud } from '@/hooks/useSolicitudes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CerrarSolicitudDialogProps {
  solicitud: Solicitud;
  isOpen: boolean;
  onClose: () => void;
}

export const CerrarSolicitudDialog = ({ solicitud, isOpen, onClose }: CerrarSolicitudDialogProps) => {
  const { cerrarSolicitud, isClosing } = useSolicitudes();

  const handleCerrar = async () => {
    try {
      await cerrarSolicitud(solicitud.id);
      onClose();
    } catch (error) {
      console.error('Error al cerrar solicitud:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar Cierre de Solicitud</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Información de la solicitud:</h4>
            <p><strong>Título:</strong> {solicitud.titulo}</p>
            <p><strong>Descripción:</strong> {solicitud.descripcion}</p>
            {solicitud.fecha_inicio_ejecucion && (
              <p><strong>Inicio de ejecución:</strong> {format(new Date(solicitud.fecha_inicio_ejecucion), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            )}
            {solicitud.horas_transcurridas && (
              <p><strong>Tiempo transcurrido:</strong> {solicitud.horas_transcurridas.toFixed(2)} horas</p>
            )}
          </div>

          {solicitud.progreso_ejecucion && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Progreso registrado:</h4>
              <p className="whitespace-pre-wrap">{solicitud.progreso_ejecucion}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              ¿Está seguro que desea cerrar esta solicitud? Esta acción no se puede deshacer y detendrá el contador de tiempo.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCerrar}
            disabled={isClosing}
            variant="destructive"
          >
            {isClosing ? 'Cerrando...' : 'Cerrar Solicitud'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};