import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Building } from 'lucide-react';
import { useSolicitudes, type Solicitud } from '@/hooks/useSolicitudes';
import { useAuth } from '@/hooks/useAuth';

interface SolicitudCardProps {
  solicitud: Solicitud;
}

const getEstadoBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return 'outline';
    case 'aceptada':
      return 'secondary';
    case 'en_ejecucion':
      return 'default';
    case 'cerrada':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return 'text-yellow-600';
    case 'aceptada':
      return 'text-blue-600';
    case 'en_ejecucion':
      return 'text-green-600';
    case 'cerrada':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

export const SolicitudCard = ({ solicitud }: SolicitudCardProps) => {
  const { user } = useAuth();
  const { aceptarSolicitud, iniciarEjecucion, cerrarSolicitud, isAccepting, isStarting, isClosing } = useSolicitudes();

  const canManageSolicitud = user?.id !== solicitud.solicitante_id;
  const showDiasPendientes = solicitud.estado === 'pendiente' && solicitud.dias_pendientes && solicitud.dias_pendientes > 0;

  const handleAceptar = async () => {
    try {
      await aceptarSolicitud(solicitud.id);
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
    }
  };

  const handleIniciarEjecucion = async () => {
    try {
      await iniciarEjecucion(solicitud.id);
    } catch (error) {
      console.error('Error al iniciar ejecución:', error);
    }
  };

  const handleCerrar = async () => {
    try {
      await cerrarSolicitud(solicitud.id);
    } catch (error) {
      console.error('Error al cerrar solicitud:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{solicitud.titulo}</CardTitle>
          <div className="flex gap-2 items-center">
            <Badge variant={getEstadoBadgeVariant(solicitud.estado)} className={getEstadoColor(solicitud.estado)}>
              {solicitud.estado.replace('_', ' ').toUpperCase()}
            </Badge>
            {showDiasPendientes && (
              <Badge variant="outline" className="text-red-600 border-red-600">
                <Clock className="w-3 h-3 mr-1" />
                {solicitud.dias_pendientes} días pendiente
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{solicitud.descripcion}</p>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              <span>{solicitud.area?.nombre}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{solicitud.solicitante?.full_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(solicitud.fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
            </div>
          </div>

          {canManageSolicitud && (
            <div className="flex gap-2 mt-4">
              {solicitud.estado === 'pendiente' && (
                <Button 
                  size="sm" 
                  onClick={handleAceptar}
                  disabled={isAccepting}
                >
                  {isAccepting ? 'Aceptando...' : 'Aceptar'}
                </Button>
              )}
              
              {solicitud.estado === 'aceptada' && (
                <Button 
                  size="sm" 
                  onClick={handleIniciarEjecucion}
                  disabled={isStarting}
                >
                  {isStarting ? 'Iniciando...' : 'Iniciar Ejecución'}
                </Button>
              )}
              
              {(solicitud.estado === 'aceptada' || solicitud.estado === 'en_ejecucion') && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCerrar}
                  disabled={isClosing}
                >
                  {isClosing ? 'Cerrando...' : 'Cerrar'}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};