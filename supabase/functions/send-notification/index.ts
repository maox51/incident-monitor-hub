import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  console.log("🚀 send-notification function called");
  console.log("Method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar método HTTP
    if (req.method !== "POST") {
      console.log("❌ Invalid method:", req.method);
      return new Response(JSON.stringify({ error: "Método no permitido" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Log todas las variables de entorno disponibles
    console.log(
      "🔍 Available environment variables:",
      Object.keys(Deno.env.toObject())
    );

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey =
      Deno.env.get("RESEND_API_KEY") || "re_Lgrr7btK_PUV4GWBJr1PAsXdTxJYiS41q"; // Fallback temporal

    console.log("🔑 Supabase URL:", supabaseUrl ? "Present" : "Missing");
    console.log("🔑 Service Key:", supabaseServiceKey ? "Present" : "Missing");
    console.log("🔑 Resend API Key:", resendApiKey ? "Present" : "Missing");
    console.log(
      "🔑 Resend API Key (first 10 chars):",
      resendApiKey ? resendApiKey.substring(0, 10) + "..." : "Missing"
    );

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Configuración de Supabase faltante" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Servicio de email no configurado" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar y parsear datos de entrada
    let notificationData: NotificationRequest;
    try {
      const body = await req.json();
      console.log("📥 Request body:", JSON.stringify(body, null, 2));

      // Validar campos requeridos
      if (!body.incidencia_id || !body.titulo || !body.prioridad) {
        throw new Error("Faltan campos obligatorios");
      }

      notificationData = {
        incidencia_id: body.incidencia_id,
        titulo: body.titulo,
        descripcion: body.descripcion || "",
        prioridad: body.prioridad,
        area_nombre: body.area_nombre || "",
        clasificacion_nombre: body.clasificacion_nombre || "",
        reportado_por: body.reportado_por || "",
      };
    } catch (error) {
      console.error("❌ Error parsing request body:", error);
      return new Response(
        JSON.stringify({ error: "Datos de entrada inválidos" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(
      "📝 Processing notification for incident:",
      notificationData.incidencia_id
    );
    console.log("🎯 Priority:", notificationData.prioridad);

    // Validar prioridad - Solo enviar para alta y crítica
    const validPriorities = ["alta", "critica"];
    if (!validPriorities.includes(notificationData.prioridad.toLowerCase())) {
      console.log(
        "⚠️ Priority not high enough for notification:",
        notificationData.prioridad
      );
      return new Response(
        JSON.stringify({ message: "Prioridad no requiere notificación" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Obtener administradores con notificaciones habilitadas
    console.log("🔍 Fetching notification admins...");
    const { data: admins, error: adminsError } = await supabase.rpc(
      "get_notification_admins"
    );

    if (adminsError) {
      console.error("❌ Error fetching notification admins:", adminsError);
      return new Response(
        JSON.stringify({
          error: "Error interno del servidor",
          details: adminsError,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("👥 Found admins:", admins ? admins.length : 0);
    console.log("📧 Admin details:", JSON.stringify(admins, null, 2));

    if (!admins || admins.length === 0) {
      console.log("⚠️ No administrators found with notifications enabled");
      return new Response(
        JSON.stringify({
          message: "No hay administradores con notificaciones habilitadas",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Preparar contenido del email
    const prioridadText =
      notificationData.prioridad === "critica" ? "CRÍTICA" : "ALTA";
    const urgencyEmoji = notificationData.prioridad === "critica" ? "🚨" : "⚠️";
    const currentDate = new Date().toLocaleString("es-ES", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailSubject = `${urgencyEmoji} INCIDENCIA ${prioridadText} - ${notificationData.titulo}`;

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: ${
          notificationData.prioridad === "critica" ? "#DC2626" : "#EA580C"
        }; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${urgencyEmoji} NUEVA INCIDENCIA ${prioridadText}</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #1f2937; margin-top: 0;">${
            notificationData.titulo
          }</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${
            notificationData.prioridad === "critica" ? "#DC2626" : "#EA580C"
          };">
            <h3 style="color: #374151; margin-top: 0;">Detalles de la Incidencia:</h3>
            <p><strong>Descripción:</strong> ${notificationData.descripcion}</p>
            <p><strong>Área:</strong> ${notificationData.area_nombre}</p>
            <p><strong>Clasificación:</strong> ${
              notificationData.clasificacion_nombre
            }</p>
            <p><strong>Prioridad:</strong> <span style="color: ${
              notificationData.prioridad === "critica" ? "#DC2626" : "#EA580C"
            }; font-weight: bold;">${prioridadText}</span></p>
            <p><strong>Reportado por:</strong> ${
              notificationData.reportado_por
            }</p>
            <p><strong>Fecha:</strong> ${currentDate}</p>
          </div>
          
          <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #991b1b;">
              <strong>⚡ Acción requerida:</strong> Esta incidencia requiere atención inmediata debido a su prioridad ${prioridadText}.
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://monitoreoesva.vercel.app" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Ver Sistema de Monitoreo
            </a>
          </div>
        </div>
        
        <div style="background: #6b7280; color: white; padding: 15px; text-align: center; font-size: 12px;">
          Sistema de Monitoreo - Grupo Esvasa<br>
          Este es un mensaje automático generado por el sistema.<br>
          <span style="opacity: 0.8;">ID: ${notificationData.incidencia_id.slice(
            0,
            8
          )}</span>
        </div>
      </div>
    `;

    // Enviar email usando Resend
    try {
      console.log("📧 Attempting to send email via Resend...");
      console.log(
        "📧 Recipients:",
        admins.map((admin: any) => admin.email)
      );

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Sistema Monitoreo <onboarding@resend.dev>",
          to: ["malbertortega@gmail.com"],
          subject: emailSubject,
          html: emailBody,
          tags: [
            {
              name: "category",
              value: "incident-notification",
            },
            {
              name: "priority",
              value: notificationData.prioridad,
            },
          ],
        }),
      });

      console.log("📧 Resend response status:", resendResponse.status);

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error("❌ Resend API error:", resendResponse.status, errorText);

        return new Response(
          JSON.stringify({
            success: false,
            error: "Error enviando notificaciones por email",
            details: errorText,
            recipients_count: admins.length,
            email_sent: false,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const emailResponse = await resendResponse.json();
      console.log("✅ Email sent successfully:", emailResponse);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Notificación enviada exitosamente",
          data: { id: emailResponse.id },
          recipients_count: admins.length,
          recipients: admins.map((admin: any) => admin.email),
          email_sent: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Error enviando notificaciones por email",
          details: emailError.message,
          recipients_count: admins.length,
          email_sent: false,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error: any) {
    console.error("❌ Unexpected error in send-notification function:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
