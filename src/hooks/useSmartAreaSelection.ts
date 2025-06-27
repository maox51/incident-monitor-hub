
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AreaMapping {
  area_id: string;
  prioridad_sugerida: string;
}

export const useSmartAreaSelection = () => {
  const [areaMappings, setAreaMappings] = useState<Record<string, AreaMapping[]>>({});

  useEffect(() => {
    loadAreaMappings();
  }, []);

  const loadAreaMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('clasificacion_area_mapping')
        .select(`
          clasificacion_id,
          area_id,
          prioridad_sugerida,
          areas!inner(nombre)
        `)
        .eq('activo', true);

      if (error) throw error;

      // Organizar mappings por clasificación
      const mappings: Record<string, AreaMapping[]> = {};
      data?.forEach((mapping) => {
        if (!mappings[mapping.clasificacion_id]) {
          mappings[mapping.clasificacion_id] = [];
        }
        mappings[mapping.clasificacion_id].push({
          area_id: mapping.area_id,
          prioridad_sugerida: mapping.prioridad_sugerida || 'media'
        });
      });

      setAreaMappings(mappings);
    } catch (error) {
      console.error('Error loading area mappings:', error);
    }
  };

  const getSuggestedArea = (clasificacionId: string): { areaId: string; prioridad: string } | null => {
    const mappings = areaMappings[clasificacionId];
    if (!mappings || mappings.length === 0) {
      return null;
    }

    // Seleccionar el primer mapeo disponible
    const mapping = mappings[0];
    return {
      areaId: mapping.area_id,
      prioridad: mapping.prioridad_sugerida
    };
  };

  return { getSuggestedArea, loadAreaMappings };
};
