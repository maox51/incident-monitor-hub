import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { SolicitudForm } from './SolicitudForm';
import { SolicitudCard } from './SolicitudCard';
import { GestionPagoDialog } from './GestionPagoDialog';
import { useSolicitudes } from '@/hooks/useSolicitudesTemp';

export const SolicitudesView = () => {
  const [showForm, setShowForm] = useState(false);
  const { solicitudes, isLoading } = useSolicitudes();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (showForm) {
    return <SolicitudForm onCancel={() => setShowForm(false)} />;
  }

  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const solicitudesEnEjecucion = solicitudes.filter(s => s.estado === 'en_ejecucion');
  const solicitudesCerradas = solicitudes.filter(s => s.estado === 'cerrada');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Solicitudes</h1>
          <p className="text-muted-foreground">Gestiona las solicitudes del sistema</p>
        </div>
        <div className="flex gap-3">
          <GestionPagoDialog />
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{solicitudesPendientes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Ejecución</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{solicitudesEnEjecucion.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cerradas</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{solicitudesCerradas.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes estados */}
      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="en_ejecucion">En Ejecución</TabsTrigger>
          <TabsTrigger value="cerradas">Cerradas</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4">
          {solicitudes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No hay solicitudes registradas
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {solicitudes.map((solicitud) => (
                <SolicitudCard key={solicitud.id} solicitud={solicitud as any} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pendientes" className="space-y-4">
          <div className="grid gap-4">
            {solicitudesPendientes.map((solicitud) => (
              <SolicitudCard key={solicitud.id} solicitud={solicitud as any} />
            ))}
          </div>
        </TabsContent>


        <TabsContent value="en_ejecucion" className="space-y-4">
          <div className="grid gap-4">
            {solicitudesEnEjecucion.map((solicitud) => (
              <SolicitudCard key={solicitud.id} solicitud={solicitud as any} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cerradas" className="space-y-4">
          <div className="grid gap-4">
            {solicitudesCerradas.map((solicitud) => (
              <SolicitudCard key={solicitud.id} solicitud={solicitud as any} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};