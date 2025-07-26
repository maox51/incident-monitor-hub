
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { usePeriodComparison } from "@/hooks/usePeriodComparison";

const PeriodComparisonCard = () => {
  const { data: comparison, isLoading } = usePeriodComparison();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Comparación de Períodos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Comparación de Períodos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No hay datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-red-600';
    if (value < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Comparación de Períodos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">{comparison.mesActual.nombre}</p>
            <p className="text-2xl font-bold">{comparison.mesActual.stats.total}</p>
            <p className="text-xs text-gray-500">incidencias</p>
          </div>
          <div>
            <p className="text-sm font-medium">{comparison.mesAnterior.nombre}</p>
            <p className="text-2xl font-bold">{comparison.mesAnterior.stats.total}</p>
            <p className="text-xs text-gray-500">incidencias</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Tendencia Total:</span>
            <span className={`text-sm font-medium ${getTrendColor(comparison.tendencias.total)}`}>
              {comparison.tendencias.total > 0 ? '+' : ''}{comparison.tendencias.total}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Críticas:</span>
            <span className={`text-sm font-medium ${getTrendColor(comparison.tendencias.criticas)}`}>
              {comparison.tendencias.criticas > 0 ? '+' : ''}{comparison.tendencias.criticas}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PeriodComparisonCard;
