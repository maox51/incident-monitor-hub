
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Obtener la fecha objetivo (por defecto hoy)
    const { fecha } = await req.json().catch(() => ({ fecha: null }))
    const fechaObjetivo = fecha || new Date().toISOString().split('T')[0]

    console.log(`Generando consolidado para la fecha: ${fechaObjetivo}`)

    // Llamar a la función de base de datos para generar el consolidado
    const { data: reporteId, error: funcionError } = await supabaseClient
      .rpc('generar_reporte_consolidado', { fecha_objetivo: fechaObjetivo })

    if (funcionError) {
      console.error('Error calling consolidation function:', funcionError)
      throw funcionError
    }

    console.log(`Consolidado generado con ID: ${reporteId}`)

    // Obtener los datos del reporte generado
    const { data: reporte, error: reporteError } = await supabaseClient
      .from('reportes_consolidados')
      .select('*')
      .eq('id', reporteId)
      .single()

    if (reporteError) {
      console.error('Error fetching generated report:', reporteError)
      throw reporteError
    }

    // Si es hora automática (21:00), enviar notificación a administradores
    const ahora = new Date()
    const esHoraAutomatica = ahora.getHours() === 21 && ahora.getMinutes() < 5

    if (esHoraAutomatica && reporte.total_incidencias > 0) {
      // Obtener administradores para notificar
      const { data: admins } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('role', 'admin')

      console.log(`Enviando notificaciones a ${admins?.length || 0} administradores`)

      // Aquí podrías integrar con un servicio de email para enviar notificaciones
      // Por ahora solo registramos en logs
      console.log('Reporte consolidado generado automáticamente:', {
        fecha: fechaObjetivo,
        total_incidencias: reporte.total_incidencias,
        incidencias_criticas: reporte.incidencias_criticas,
        areas_afectadas: reporte.areas_afectadas
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        mensaje: `Consolidado generado exitosamente para ${fechaObjetivo}`,
        reporte_id: reporteId,
        estadisticas: {
          total_incidencias: reporte.total_incidencias,
          incidencias_criticas: reporte.incidencias_criticas,
          incidencias_altas: reporte.incidencias_altas,
          areas_afectadas: reporte.areas_afectadas,
          salas_afectadas: reporte.salas_afectadas
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in daily consolidation:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
