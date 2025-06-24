
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const notificationData: NotificationRequest = await req.json();
    
    console.log('Received notification request:', notificationData);

    // Solo enviar notificaciones para prioridades alta y crítica
    if (notificationData.prioridad !== 'alta' && notificationData.prioridad !== 'critica') {
      console.log('Priority not high enough for notification:', notificationData.prioridad);
      return new Response(
        JSON.stringify({ message: 'Notification not sent - priority not high enough' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Obtener todos los administradores con notificaciones habilitadas
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        notification_settings(
          email_notifications,
          high_priority_alerts
        )
      `)
      .eq('role', 'admin');

    if (adminsError) {
      console.error('Error fetching admins:', adminsError);
      throw new Error('Error al obtener administradores');
    }

    if (!admins || admins.length === 0) {
      console.log('No admins found');
      return new Response(
        JSON.stringify({ message: 'No administrators found' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Found admins:', admins.length);

    // Filtrar administradores que tienen las notificaciones habilitadas
    const adminsConNotificaciones = admins.filter(admin => {
      const settings = admin.notification_settings?.[0];
      return settings ? 
        (settings.email_notifications && settings.high_priority_alerts) : 
        true; // Si no tiene configuración, asumir que quiere notificaciones
    });

    console.log('Admins with notifications enabled:', adminsConNotificaciones.length);

    if (adminsConNotificaciones.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No administrators have notifications enabled' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Preparar el email
    const prioridadText = notificationData.prioridad === 'critica' ? 'CRÍTICA' : 'ALTA';
    const urgencyEmoji = notificationData.prioridad === 'critica' ? '🚨' : '⚠️';
    
    const emailSubject = `${urgencyEmoji} INCIDENCIA ${prioridadText} - ${notificationData.titulo}`;
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${notificationData.prioridad === 'critica' ? '#DC2626' : '#EA580C'}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${urgencyEmoji} NUEVA INCIDENCIA ${prioridadText}</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #1f2937; margin-top: 0;">${notificationData.titulo}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h3 style="color: #374151; margin-top: 0;">Detalles de la Incidencia:</h3>
            <p><strong>Descripción:</strong> ${notificationData.descripcion}</p>
            <p><strong>Área:</strong> ${notificationData.area_nombre}</p>
            <p><strong>Clasificación:</strong> ${notificationData.clasificacion_nombre}</p>
            <p><strong>Prioridad:</strong> <span style="color: ${notificationData.prioridad === 'critica' ? '#DC2626' : '#EA580C'}; font-weight: bold;">${prioridadText}</span></p>
            <p><strong>Reportado por:</strong> ${notificationData.reportado_por}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          
          <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px;">
            <p style="margin: 0; color: #991b1b;">
              <strong>⚡ Acción requerida:</strong> Esta incidencia requiere atención inmediata debido a su prioridad ${prioridadText}.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <a href="https://wbuddpspfxufhftkcaww.supabase.co" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Sistema de Monitoreo
            </a>
          </div>
        </div>
        
        <div style="background: #6b7280; color: white; padding: 15px; text-align: center; font-size: 12px;">
          Sistema de Monitoreo - Casino<br>
          Este es un mensaje automático generado por el sistema.
        </div>
      </div>
    `;

    // Intentar enviar el email usando diferentes métodos
    let emailSent = false;
    let emailResponse = null;

    // Método 1: Intentar con Resend si está configurado
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey && !emailSent) {
      try {
        console.log('Trying to send email with Resend...');
        
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Sistema Monitoreo <notificaciones@yourdomain.com>',
            to: adminsConNotificaciones.map(admin => admin.email),
            subject: emailSubject,
            html: emailBody,
          }),
        });

        if (resendResponse.ok) {
          emailResponse = await resendResponse.json();
          emailSent = true;
          console.log('Email sent successfully with Resend:', emailResponse);
        } else {
          const error = await resendResponse.text();
          console.error('Resend error:', error);
        }
      } catch (error) {
        console.error('Error with Resend:', error);
      }
    }

    // Método 2: Fallback - Log detallado para configuración manual
    if (!emailSent) {
      console.log('=== EMAIL NOTIFICATION DETAILS ===');
      console.log('Subject:', emailSubject);
      console.log('Recipients:', adminsConNotificaciones.map(admin => `${admin.full_name || 'Admin'} <${admin.email}>`));
      console.log('Priority:', prioridadText);
      console.log('Incident ID:', notificationData.incidencia_id);
      console.log('=== END EMAIL DETAILS ===');

      // Crear registro en la base de datos para tracking
      const { error: logError } = await supabase
        .from('notification_settings')
        .upsert(
          adminsConNotificaciones.map(admin => ({
            user_id: admin.id,
            email_notifications: true,
            high_priority_alerts: true,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'user_id' }
        );

      if (logError) {
        console.error('Error logging notification attempt:', logError);
      }

      emailResponse = {
        message: 'Notification logged - Configure email service for actual delivery',
        method: 'console_log',
        recipients: adminsConNotificaciones.length,
        incident_id: notificationData.incidencia_id
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent ? 'Notification sent successfully' : 'Notification logged - Email service needs configuration',
        data: emailResponse,
        recipients_count: adminsConNotificaciones.length,
        email_sent: emailSent
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);
