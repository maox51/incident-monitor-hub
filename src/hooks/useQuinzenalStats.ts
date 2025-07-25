
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuinzenalStats {
  primera_quincena: {
    ingresos_tardios: number;
    cierres_prematuros: number;
    periodo: string;
    minutos_totales_por_sala: Record<string, number>;
  };
  segunda_quincena: {
    ingresos_tardios: number;
    cierres_prematuros: number;
    periodo: string;
    minutos_totales_por_sala: Record<string, number>;
  };
}

export const useQuinzenalStats = () => {
  const [stats, setStats] = useState<QuinzenalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentQuincena = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    if (day <= 15) {
      return {
        periodo: 'primera',
        inicio: new Date(year, month - 1, 1),
        fin: new Date(year, month - 1, 15, 23, 59, 59)
      };
    } else {
      const lastDay = new Date(year, month, 0).getDate();
      return {
        periodo: 'segunda',
        inicio: new Date(year, month - 1, 16),
        fin: new Date(year, month - 1, lastDay, 23, 59, 59)
      };
    }
  };

  const getQuincenalPeriods = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const lastDay = new Date(year, month, 0).getDate();

    return {
      primera: {
        inicio: new Date(year, month - 1, 1),
        fin: new Date(year, month - 1, 15, 23, 59, 59),
        nombre: `Primera quincena ${month}/${year}`
      },
      segunda: {
        inicio: new Date(year, month - 1, 16),
        fin: new Date(year, month - 1, lastDay, 23, 59, 59),
        nombre: `Segunda quincena ${month}/${year}`
      }
    };
  };

  const fetchQuinzenalStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const periods = getQuincenalPeriods();

      // Obtener estadísticas de primera quincena - SOLO INCIDENCIAS APROBADAS
      const { data: primeraData, error: primeraError } = await supabase
        .from('incidencias')
        .select(`
          *,
          salas(nombre)
        `)
        .eq('estado', 'aprobado')
        .gte('created_at', periods.primera.inicio.toISOString())
        .lte('created_at', periods.primera.fin.toISOString())
        .in('clasificacion_id', ['ingreso_tardio', 'cierre_prematuro']);

      if (primeraError) throw primeraError;

      // Obtener estadísticas de segunda quincena - SOLO INCIDENCIAS APROBADAS
      const { data: segundaData, error: segundaError } = await supabase
        .from('incidencias')
        .select(`
          *,
          salas(nombre)
        `)
        .eq('estado', 'aprobado')
        .gte('created_at', periods.segunda.inicio.toISOString())
        .lte('created_at', periods.segunda.fin.toISOString())
        .in('clasificacion_id', ['ingreso_tardio', 'cierre_prematuro']);

      if (segundaError) throw segundaError;

      // Función para calcular minutos REINICIADOS por quincena y por sala
      const calcularMinutosPorSalaQuincenal = (datos: any[], periodoInicio: Date, periodoFin: Date) => {
        const minutosPorSala: Record<string, number> = {};
        
        // Filtrar solo las incidencias del periodo específico
        const incidenciasPeriodo = datos.filter(incidencia => {
          const fechaIncidencia = new Date(incidencia.created_at);
          return fechaIncidencia >= periodoInicio && fechaIncidencia <= periodoFin;
        });
        
        incidenciasPeriodo.forEach(incidencia => {
          const nombreSala = incidencia.salas?.nombre || 'Sin sala';
          const minutos = incidencia.tiempo_minutos || 0;
          
          if (!minutosPorSala[nombreSala]) {
            minutosPorSala[nombreSala] = 0;
          }
          minutosPorSala[nombreSala] += minutos;
        });
        
        return minutosPorSala;
      };

      // Procesar datos de primera quincena (reinicio automático)
      const primeraStats = {
        ingresos_tardios: primeraData?.filter(inc => inc.titulo?.toLowerCase().includes('ingreso tardío') || inc.descripcion?.toLowerCase().includes('ingreso tardío')).length || 0,
        cierres_prematuros: primeraData?.filter(inc => inc.titulo?.toLowerCase().includes('cierre prematuro') || inc.descripcion?.toLowerCase().includes('cierre prematuro')).length || 0,
        periodo: periods.primera.nombre,
        minutos_totales_por_sala: calcularMinutosPorSalaQuincenal(primeraData || [], periods.primera.inicio, periods.primera.fin)
      };

      // Procesar datos de segunda quincena (reinicio automático)
      const segundaStats = {
        ingresos_tardios: segundaData?.filter(inc => inc.titulo?.toLowerCase().includes('ingreso tardío') || inc.descripcion?.toLowerCase().includes('ingreso tardío')).length || 0,
        cierres_prematuros: segundaData?.filter(inc => inc.titulo?.toLowerCase().includes('cierre prematuro') || inc.descripcion?.toLowerCase().includes('cierre prematuro')).length || 0,
        periodo: periods.segunda.nombre,
        minutos_totales_por_sala: calcularMinutosPorSalaQuincenal(segundaData || [], periods.segunda.inicio, periods.segunda.fin)
      };

      setStats({
        primera_quincena: primeraStats,
        segunda_quincena: segundaStats
      });

    } catch (error) {
      console.error('Error fetching quinzenal stats:', error);
      setError('Error al cargar las estadísticas quincenales');
    } finally {
      setLoading(false);
    }
  };

  const addIncidenciaToCount = async (tipo: 'ingreso_tardio' | 'cierre_prematuro', detalles: any) => {
    try {
      const currentQuincena = getCurrentQuincena();
      
      // Crear incidencia específica para el conteo quincenal
      const { error } = await supabase
        .from('incidencias')
        .insert({
          titulo: tipo === 'ingreso_tardio' ? 'Ingreso Tardío' : 'Cierre Prematuro',
          descripcion: `Registrado automáticamente - ${tipo === 'ingreso_tardio' ? 'Ingreso Tardío' : 'Cierre Prematuro'}`,
          area_id: detalles.area_id,
          sala_id: detalles.sala_id,
          clasificacion_id: detalles.clasificacion_id,
          reportado_por: detalles.reportado_por,
          prioridad: 'media',
          estado: 'aprobado',
          observaciones: `Periodo: ${currentQuincena.periodo} quincena - ${JSON.stringify(detalles)}`,
          fecha_incidencia: new Date().toISOString(),
          tiempo_minutos: detalles.tiempo_minutos || 0
        });

      if (error) throw error;
      
      // Refrescar estadísticas
      await fetchQuinzenalStats();
      
      return true;
    } catch (error) {
      console.error('Error adding quinzenal count:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchQuinzenalStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchQuinzenalStats,
    addIncidenciaToCount,
    getCurrentQuincena
  };
};
