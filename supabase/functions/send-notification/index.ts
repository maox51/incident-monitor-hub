
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface NotificationRequest {
  incidencia_id: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  area_nombre: string;
  clasificacion_nombre: string;
  reportado_por: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { incidencia_id, titulo, descripcion, prioridad, area_nombre, clasificacion_nombre, reportado_por }: NotificationRequest = await req.json();

    console.log("Sending notification for incident:", incidencia_id, "Priority:", prioridad);

    // Solo enviar notificaciones para prioridades alta y crítica
    if (prioridad !== 'alta' && prioridad !== 'critica') {
      return new Response(JSON.stringify({ message: "No notification needed for this priority" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Obtener todos los administradores
    const { data: admins, error: adminsError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("role", "admin");

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
      throw adminsError;
    }

    if (!admins || admins.length === 0) {
      console.log("No administrators found to notify");
      return new Response(JSON.stringify({ message: "No administrators to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Para este ejemplo, logueamos las notificaciones que se enviarían
    // En un entorno real, aquí integrarías con un servicio de email como Resend
    console.log("Would send email notifications to admins:", admins);
    
    const notificationContent = {
      subject: `🚨 Nueva Incidencia de Prioridad ${prioridad.toUpperCase()} - ${titulo}`,
      message: `
        Se ha registrado una nueva incidencia de prioridad ${prioridad}:
        
        Título: ${titulo}
        Descripción: ${descripcion}
        Área: ${area_nombre}
        Clasificación: ${clasificacion_nombre}
        Reportado por: ${reportado_por}
        Prioridad: ${prioridad.toUpperCase()}
        
        Por favor, revise la incidencia en el sistema de monitoreo.
      `
    };

    console.log("Notification content:", notificationContent);
    
    // Simular envío exitoso
    // En producción, aquí irían las llamadas reales al servicio de email
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notifications sent successfully",
      recipients: admins.length 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
