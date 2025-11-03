import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  tipo?: string; // 'incidencia' o 'solicitud'
  incidencia_id?: string;
  solicitud_id?: string;
  titulo: string;
  descripcion: string;
  prioridad?: string;
  area_nombre: string;
  clasificacion_nombre?: string;
  reportado_por?: string;
  solicitante_nombre?: string;
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    console.log("🔑 Supabase URL:", supabaseUrl ? "Present" : "Missing");
    console.log("🔑 Service Key:", supabaseServiceKey ? "Present" : "Missing");
    console.log("🔑 Resend API Key:", resendApiKey ? "Present" : "Missing");

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
      console.error("❌ Missing Resend API Key");
      return new Response(
        JSON.stringify({ error: "Servicio de email no configurado" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validar y parsear datos de entrada
    let notificationData: NotificationRequest;
    let notificationType: string;
    try {
      const body = await req.json();
      console.log("📥 Request body:", JSON.stringify(body, null, 2));

      notificationType = body.tipo || 'incidencia';

      // Validar campos requeridos según tipo
      if (notificationType === 'solicitud') {
        if (!body.solicitud_id || !body.titulo) {
          throw new Error("Faltan campos obligatorios para solicitud");
        }
        notificationData = {
          tipo: 'solicitud',
          solicitud_id: body.solicitud_id,
          titulo: body.titulo,
          descripcion: body.descripcion || "",
          area_nombre: body.area_nombre || "",
          solicitante_nombre: body.solicitante_nombre || "",
        };
      } else {
        if (!body.incidencia_id || !body.titulo || !body.prioridad) {
          throw new Error("Faltan campos obligatorios para incidencia");
        }
        notificationData = {
          tipo: 'incidencia',
          incidencia_id: body.incidencia_id,
          titulo: body.titulo,
          descripcion: body.descripcion || "",
          prioridad: body.prioridad,
          area_nombre: body.area_nombre || "",
          clasificacion_nombre: body.clasificacion_nombre || "",
          reportado_por: body.reportado_por || "",
        };
      }
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
      "📝 Processing notification type:",
      notificationType
    );
    console.log("🎯 ID:", notificationData.incidencia_id || notificationData.solicitud_id);

    // Para incidencias, validar prioridad - Solo enviar para alta y crítica
    if (notificationType === 'incidencia') {
      const validPriorities = ["alta", "critica"];
      if (!notificationData.prioridad || !validPriorities.includes(notificationData.prioridad.toLowerCase())) {
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
    }

    // Obtener destinatarios según el tipo
    console.log("🔍 Fetching notification recipients...");
    const rpcFunction = notificationType === 'solicitud' 
      ? 'get_solicitudes_notification_users'
      : 'get_notification_admins';
    
    const { data: recipients, error: recipientsError } = await supabase.rpc(rpcFunction);

    if (recipientsError) {
      console.error("❌ Error fetching notification recipients:", recipientsError);
      return new Response(
        JSON.stringify({
          error: "Error interno del servidor",
          details: recipientsError,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("👥 Found recipients:", recipients ? recipients.length : 0);
    console.log("📧 Recipient details:", JSON.stringify(recipients, null, 2));

    if (!recipients || recipients.length === 0) {
      console.log("⚠️ No recipients found");
      return new Response(
        JSON.stringify({
          message: "No hay destinatarios para notificar",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Preparar contenido del email según el tipo
    const currentDate = new Date().toLocaleString("es-ES", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    let emailSubject: string;
    let emailBody: string;

    if (notificationType === 'solicitud') {
      emailSubject = `📋 NUEVA SOLICITUD - ${notificationData.titulo}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📋 NUEVA SOLICITUD</h1>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa;">
            <h2 style="color: #1f2937; margin-top: 0;">${notificationData.titulo}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2563eb;">
              <h3 style="color: #374151; margin-top: 0;">Detalles de la Solicitud:</h3>
              <p><strong>Descripción:</strong> ${notificationData.descripcion}</p>
              <p><strong>Área:</strong> ${notificationData.area_nombre}</p>
              <p><strong>Solicitante:</strong> ${notificationData.solicitante_nombre}</p>
              <p><strong>Fecha:</strong> ${currentDate}</p>
            </div>
            
            <div style="background: #dbeafe; border: 1px solid #93c5fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; color: #1e40af;">
                <strong>📌 Acción requerida:</strong> Una nueva solicitud ha sido creada y requiere atención.
              </p>
            </div>
            
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="https://monitoreoesva.vercel.app/solicitudes" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Ver Solicitud
              </a>
            </div>
          </div>
          
          <div style="background: #6b7280; color: white; padding: 15px; text-align: center; font-size: 12px;">
            Sistema de Monitoreo - Grupo Esvasa<br>
            Este es un mensaje automático generado por el sistema.<br>
            <span style="opacity: 0.8;">ID: ${notificationData.solicitud_id?.slice(0, 8)}</span>
          </div>
        </div>
      `;
    } else {
      const prioridadText = notificationData.prioridad === "critica" ? "CRÍTICA" : "ALTA";
      const urgencyEmoji = notificationData.prioridad === "critica" ? "🚨" : "⚠️";
      
      emailSubject = `${urgencyEmoji} INCIDENCIA ${prioridadText} - ${notificationData.titulo}`;
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: ${
            notificationData.prioridad === "critica" ? "#DC2626" : "#EA580C"
          }; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${urgencyEmoji} NUEVA INCIDENCIA ${prioridadText}</h1>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa;">
            <h2 style="color: #1f2937; margin-top: 0;">${notificationData.titulo}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${
              notificationData.prioridad === "critica" ? "#DC2626" : "#EA580C"
            };">
              <h3 style="color: #374151; margin-top: 0;">Detalles de la Incidencia:</h3>
              <p><strong>Descripción:</strong> ${notificationData.descripcion}</p>
              <p><strong>Área:</strong> ${notificationData.area_nombre}</p>
              <p><strong>Clasificación:</strong> ${notificationData.clasificacion_nombre}</p>
              <p><strong>Prioridad:</strong> <span style="color: ${
                notificationData.prioridad === "critica" ? "#DC2626" : "#EA580C"
              }; font-weight: bold;">${prioridadText}</span></p>
              <p><strong>Reportado por:</strong> ${notificationData.reportado_por}</p>
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
            <span style="opacity: 0.8;">ID: ${notificationData.incidencia_id?.slice(0, 8)}</span>
          </div>
        </div>
      `;
    }

    // Enviar email usando Resend
    try {
      console.log("📧 Attempting to send email via Resend...");
      console.log(
        "📧 Recipients:",
        recipients.map((recipient: any) => recipient.email)
      );

      const emailResult = await resend.emails.send({
        from: "Sistema Monitoreo <onboarding@resend.dev>",
        to: recipients.map((recipient: any) => recipient.email),
        subject: emailSubject,
        html: emailBody,
      });

      console.log("✅ Email sent successfully:", emailResult);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Notificación enviada exitosamente",
          data: emailResult,
          recipients_count: recipients.length,
          recipients: recipients.map((recipient: any) => recipient.email),
          email_sent: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (emailError) {
      console.error("❌ Error sending email via Resend:", emailError);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Error enviando notificaciones por email",
          details: emailError.message,
          recipients_count: recipients.length,
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
