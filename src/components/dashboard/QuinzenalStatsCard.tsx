
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuinzenalStats } from '@/hooks/useQuinzenalStats';
import { Clock, LogOut, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const QuinzenalStatsCard = () => {
  const { stats, loading, error, refetch } = useQuinzenalStats();
  const { profile } = useAuth();

  // Solo mostrar para roles de RRHH y admin
  if (!profile || !['rrhh', 'admin', 'supervisor_monitoreo'].includes(profile.role)) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Estadísticas Quincenales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error en Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Estadísticas Quincenales - RRHH
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Primera Quincena */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {stats.primera_quincena.periodo}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {stats.primera_quincena.ingresos_tardios}
                </div>
                <div className="text-sm text-blue-600">Ingresos Tardíos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-700">
                  {stats.primera_quincena.cierres_prematuros}
                </div>
                <div className="text-sm text-red-600">Cierres Prematuros</div>
              </div>
            </div>
          </div>

          {/* Segunda Quincena */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              {stats.segunda_quincena.periodo}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {stats.segunda_quincena.ingresos_tardios}
                </div>
                <div className="text-sm text-blue-600">Ingresos Tardíos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-700">
                  {stats.segunda_quincena.cierres_prematuros}
                </div>
                <div className="text-sm text-red-600">Cierres Prematuros</div>
              </div>
            </div>
          </div>

          {/* Totales del Mes */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Totales del Mes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {stats.primera_quincena.ingresos_tardios + stats.segunda_quincena.ingresos_tardios} Total Ingresos Tardíos
                </Badge>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="text-red-700 border-red-300">
                  {stats.primera_quincena.cierres_prematuros + stats.segunda_quincena.cierres_prematuros} Total Cierres Prematuros
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuinzenalStatsCard;
