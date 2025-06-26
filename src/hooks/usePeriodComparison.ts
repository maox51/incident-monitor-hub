
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";

export const usePeriodComparison = () => {
  return useQuery({
    queryKey: ["period-comparison"],
    queryFn: async () => {
      const ahora = new Date();
      const mesActual = {
        inicio: startOfMonth(ahora),
        fin: endOfMonth(ahora)
      };
      const mesAnterior = {
        inicio: startOfMonth(subMonths(ahora, 1)),
        fin: endOfMonth(subMonths(ahora, 1))
      };

      // Obtener datos del mes actual
      const { data: datosActuales, error: errorActual } = await supabase
        .from("incidencias")
        .select(`
          id,
          prioridad,
          area_id,
          clasificacion_id,
          created_at,
          areas(nombre),
          clasificaciones(nombre)
        `)
        .gte("created_at", mesActual.inicio.toISOString())
        .lte("created_at", mesActual.fin.toISOString());

      if (errorActual) {
        console.error("Error fetching current month data:", errorActual);
        return null;
      }

      // Obtener datos del mes anterior
      const { data: datosAnteriores, error: errorAnterior } = await supabase
        .from("incidencias")
        .select(`
          id,
          prioridad,
          area_id,
          clasificacion_id,
          created_at,
          areas(nombre),
          clasificaciones(nombre)
        `)
        .gte("created_at", mesAnterior.inicio.toISOString())
        .lte("created_at", mesAnterior.fin.toISOString());

      if (errorAnterior) {
        console.error("Error fetching previous month data:", errorAnterior);
        return null;
      }

      // Procesar estadísticas del mes actual
      const statsActuales = procesarEstadisticas(datosActuales || []);
      const statsAnteriores = procesarEstadisticas(datosAnteriores || []);

      // Calcular tendencias
      const tendencias = {
        total: calcularTendencia(statsActuales.total, statsAnteriores.total),
        criticas: calcularTendencia(statsActuales.criticas, statsAnteriores.criticas),
        altas: calcularTendencia(statsActuales.altas, statsAnteriores.altas),
        medias: calcularTendencia(statsActuales.medias, statsAnteriores.medias),
        bajas: calcularTendencia(statsActuales.bajas, statsAnteriores.bajas)
      };

      // Análisis de reincidencias por área
      const reincidenciasActuales = analizarReincidencias(datosActuales || []);
      const reincidenciasAnteriores = analizarReincidencias(datosAnteriores || []);

      return {
        mesActual: {
          nombre: format(mesActual.inicio, 'MMMM yyyy', { locale: es }),
          stats: statsActuales,
          reincidencias: reincidenciasActuales
        },
        mesAnterior: {
          nombre: format(mesAnterior.inicio, 'MMMM yyyy', { locale: es }),
          stats: statsAnteriores,
          reincidencias: reincidenciasAnteriores
        },
        tendencias,
        comparacion: {
          mejorArea: encontrarMejorArea(reincidenciasActuales, reincidenciasAnteriores),
          peorArea: encontrarPeorArea(reincidenciasActuales, reincidenciasAnteriores)
        }
      };
    },
  });
};

const procesarEstadisticas = (datos: any[]) => {
  return {
    total: datos.length,
    criticas: datos.filter(d => d.prioridad === 'critica').length,
    altas: datos.filter(d => d.prioridad === 'alta').length,
    medias: datos.filter(d => d.prioridad === 'media').length,
    bajas: datos.filter(d => d.prioridad === 'baja').length,
    porArea: datos.reduce((acc: any, item: any) => {
      const area = item.areas?.nombre || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {}),
    porClasificacion: datos.reduce((acc: any, item: any) => {
      const clasificacion = item.clasificaciones?.nombre || 'Sin clasificación';
      acc[clasificacion] = (acc[clasificacion] || 0) + 1;
      return acc;
    }, {})
  };
};

const calcularTendencia = (actual: number, anterior: number) => {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return Math.round(((actual - anterior) / anterior) * 100);
};

const analizarReincidencias = (datos: any[]) => {
  const reincidencias: any = {};
  
  datos.forEach(item => {
    const area = item.areas?.nombre || 'Sin área';
    const clasificacion = item.clasificaciones?.nombre || 'Sin clasificación';
    const key = `${area}-${clasificacion}`;
    
    if (!reincidencias[key]) {
      reincidencias[key] = {
        area,
        clasificacion,
        count: 0,
        incidencias: []
      };
    }
    
    reincidencias[key].count += 1;
    reincidencias[key].incidencias.push(item);
  });

  return Object.values(reincidencias)
    .filter((r: any) => r.count > 1)
    .sort((a: any, b: any) => b.count - a.count);
};

const encontrarMejorArea = (actuales: any[], anteriores: any[]) => {
  // Encontrar el área con mayor reducción de incidencias
  const mejoras = actuales.map(actual => {
    const anterior = anteriores.find(a => a.area === actual.area);
    if (!anterior) return null;
    
    const reduccion = anterior.count - actual.count;
    return {
      area: actual.area,
      reduccion,
      porcentaje: anterior.count > 0 ? Math.round((reduccion / anterior.count) * 100) : 0
    };
  }).filter(Boolean).sort((a: any, b: any) => b.reduccion - a.reduccion);

  return mejoras[0] || null;
};

const encontrarPeorArea = (actuales: any[], anteriores: any[]) => {
  // Encontrar el área con mayor aumento de incidencias
  const empeoramientos = actuales.map(actual => {
    const anterior = anteriores.find(a => a.area === actual.area) || { count: 0 };
    const aumento = actual.count - anterior.count;
    
    return {
      area: actual.area,
      aumento,
      porcentaje: anterior.count > 0 ? Math.round((aumento / anterior.count) * 100) : 100
    };
  }).filter((e: any) => e.aumento > 0).sort((a: any, b: any) => b.aumento - a.aumento);

  return empeoramientos[0] || null;
};
