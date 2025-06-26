
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserStatistic {
  nombre: string;
  total: number;
  criticas: number;
  altas: number;
  medias: number;
  bajas: number;
  ultimas_incidencias: Array<{
    fecha: string;
    prioridad: string;
  }>;
}

export const useUserStatistics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-statistics"],
    queryFn: async (): Promise<UserStatistic[]> => {
      if (!user) return [];

      // Obtener estadísticas por usuario (monitores y admins)
      const { data, error } = await supabase
        .from("incidencias")
        .select(`
          reportado_por,
          prioridad,
          created_at,
          profiles!inner(email, full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user statistics:", error);
        return [];
      }

      // Agrupar por usuario
      const userStats = data.reduce((acc: Record<string, UserStatistic>, incidencia: any) => {
        const userName = incidencia.reportado_por || incidencia.profiles?.full_name || incidencia.profiles?.email || 'Usuario Desconocido';
        
        if (!acc[userName]) {
          acc[userName] = {
            nombre: userName,
            total: 0,
            criticas: 0,
            altas: 0,
            medias: 0,
            bajas: 0,
            ultimas_incidencias: []
          };
        }

        acc[userName].total += 1;
        
        // Incrementar contador por prioridad
        switch(incidencia.prioridad) {
          case 'critica':
            acc[userName].criticas += 1;
            break;
          case 'alta':
            acc[userName].altas += 1;
            break;
          case 'media':
            acc[userName].medias += 1;
            break;
          case 'baja':
            acc[userName].bajas += 1;
            break;
        }
        
        if (acc[userName].ultimas_incidencias.length < 5) {
          acc[userName].ultimas_incidencias.push({
            fecha: incidencia.created_at,
            prioridad: incidencia.prioridad
          });
        }

        return acc;
      }, {});

      return Object.values(userStats).sort((a, b) => b.total - a.total);
    },
    enabled: !!user,
  });
};
