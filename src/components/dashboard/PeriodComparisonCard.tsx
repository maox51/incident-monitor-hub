
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import { usePeriodComparison } from "@/hooks/usePeriodComparison";
import { Badge } from "@/components/ui/badge";

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
    if (value > 0) return 'text-destructive';
    if (value < 0) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const getTrendBadgeVariant = (value: number) => {
    if (value > 0) return 'destructive';
    if (value < 0) return 'secondary';
    return 'outline';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-3 h-3" />;
    if (value < 0) return <TrendingDown className="w-3 h-3" />;
    return <BarChart3 className="w-3 h-3" />;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-primary" />
          Comparación de Períodos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comparación de números principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/5 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {comparison.mesActual.nombre}
            </p>
            <p className="text-3xl font-bold text-primary mb-1">
              {comparison.mesActual.stats.total}
            </p>
            <p className="text-xs text-muted-foreground">incidencias</p>
          </div>
          <div className="bg-secondary/10 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {comparison.mesAnterior.nombre}
            </p>
            <p className="text-3xl font-bold text-secondary-foreground mb-1">
              {comparison.mesAnterior.stats.total}
            </p>
            <p className="text-xs text-muted-foreground">incidencias</p>
          </div>
        </div>
        
        {/* Tendencias con badges y iconos */}
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tendencia Total</span>
            </div>
            <Badge variant={getTrendBadgeVariant(comparison.tendencias.total)} className="gap-1">
              {getTrendIcon(comparison.tendencias.total)}
              {comparison.tendencias.total > 0 ? '+' : ''}{comparison.tendencias.total}%
            </Badge>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Incidencias Críticas</span>
            </div>
            <Badge variant={getTrendBadgeVariant(comparison.tendencias.criticas)} className="gap-1">
              {getTrendIcon(comparison.tendencias.criticas)}
              {comparison.tendencias.criticas > 0 ? '+' : ''}{comparison.tendencias.criticas}%
            </Badge>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Críticas Actuales</p>
            <p className="text-lg font-semibold text-orange-600">
              {comparison.mesActual.stats.criticas || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Críticas Anteriores</p>
            <p className="text-lg font-semibold text-muted-foreground">
              {comparison.mesAnterior.stats.criticas || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PeriodComparisonCard;
