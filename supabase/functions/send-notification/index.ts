

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

// Función para sanitizar texto y prevenir XSS
const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[<>]/g, '') // Remover caracteres HTML básicos
    .replace(/javascript:/gi, '') // Remover protocolo javascript
    .replace(/on\w+=/gi, '') // Remover event handlers
    .slice(0, 500); // Limitar longitud
};

// Rate limiting simple en memoria (en producción usar Redis)
const notificationHistory = new Map<string, number[]>();

const isRateLimited = (incidenciaId: string): boolean => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutos
  const maxNotifications = 1; // Máximo 1 notificación por incidencia cada 5 minutos
  
  if (!notificationHistory.has(incidenciaId)) {
    notificationHistory.set(incidenciaId, []);
  }
  
  const timestamps = notificationHistory.get(incidenciaId)!;
  
  // Limpiar timestamps antiguos
  const recentTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);
  notificationHistory.set(incidenciaId, recentTimestamps);
  
  if (recentTimestamps.length >= maxNotifications) {
    return true;
  }
  
  // Agregar timestamp actual
  recentTimestamps.push(now);
  notificationHistory.set(incidenciaId, recentTimestamps);
  
  return false;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let notificationData: NotificationRequest;

  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { 
          status: 405, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Inicializar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validar y parsear datos de entrada
    try {
      const body = await req.json();
      
      // Validar campos requeridos
      if (!body.incidencia_id || !body.titulo || !body.prioridad) {
        throw new Error('Faltan campos obligatorios');
      }

      notificationData = {
        incidencia_id: sanitizeText(body.incidencia_id),
        titulo: sanitizeText(body.titulo),
        descripcion: sanitizeText(body.descripcion || ''),
        prioridad: sanitizeText(body.prioridad),
        area_nombre: sanitizeText(body.area_nombre || ''),
        clasificacion_nombre: sanitizeText(body.clasificacion_nombre || ''),
        reportado_por: sanitizeText(body.reportado_por || ''),
      };
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ error: 'Datos de entrada inválidos' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    console.log('Processing notification for incident:', notificationData.incidencia_id);

    // Verificar rate limiting
    if (isRateLimited(notificationData.incidencia_id)) {
      console.log('Rate limit exceeded for incident:', notificationData.incidencia_id);
      return new Response(
        JSON.stringify({ message: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Validar prioridad - Solo enviar para alta y crítica
    const validPriorities = ['alta', 'critica'];
    if (!validPriorities.includes(notificationData.prioridad.toLowerCase())) {
      console.log('Priority not high enough for notification:', notificationData.prioridad);
      return new Response(
        JSON.stringify({ message: 'Prioridad no requiere notificación' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Obtener administradores con notificaciones habilitadas usando la función optimizada
    const { data: admins, error: adminsError } = await supabase.rpc('get_notification_admins');

    if (adminsError) {
      console.error('Error fetching notification admins (no sensitive data logged)');
      return new Response(
        JSON.stringify({ error: 'Error interno del servidor' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (!admins || admins.length === 0) {
      console.log('No administrators found with notifications enabled');
      return new Response(
        JSON.stringify({ message: 'No hay administradores con notificaciones habilitadas' }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Found ${admins.length} admins with notifications enabled`);

    // Verificar API key de Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Servicio de email no configurado' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Preparar contenido del email
    const prioridadText = notificationData.prioridad === 'critica' ? 'CRÍTICA' : 'ALTA';
    const urgencyEmoji = notificationData.prioridad === 'critica' ? '🚨' : '⚠️';
    const currentDate = new Date().toLocaleString('es-ES', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const emailSubject = `${urgencyEmoji} INCIDENCIA ${prioridadText} - ${notificationData.titulo}`;
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: ${notificationData.prioridad === 'critica' ? '#DC2626' : '#EA580C'}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">${urgencyEmoji} NUEVA INCIDENCIA ${prioridadText}</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #1f2937; margin-top: 0;">${notificationData.titulo}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${notificationData.prioridad === 'critica' ? '#DC2626' : '#EA580C'};">
            <h3 style="color: #374151; margin-top: 0;">Detalles de la Incidencia:</h3>
            <p><strong>Descripción:</strong> ${notificationData.descripcion}</p>
            <p><strong>Área:</strong> ${notificationData.area_nombre}</p>
            <p><strong>Clasificación:</strong> ${notificationData.clasificacion_nombre}</p>
            <p><strong>Prioridad:</strong> <span style="color: ${notificationData.prioridad === 'critica' ? '#DC2626' : '#EA580C'}; font-weight: bold;">${prioridadText}</span></p>
            <p><strong>Reportado por:</strong> ${notificationData.reportado_por}</p>
            <p><strong>Fecha:</strong> ${currentDate}</p>
          </div>
          
          <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #991b1b;">
              <strong>⚡ Acción requerida:</strong> Esta incidencia requiere atención inmediata debido a su prioridad ${prioridadText}.
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://wbuddpspfxufhftkcaww.supabase.co" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Ver Sistema de Monitoreo
            </a>
          </div>
        </div>
        
        <div style="background: #6b7280; color: white; padding: 15px; text-align: center; font-size: 12px;">
          Sistema de Monitoreo - Grupo Esvasa<br>
          Este es un mensaje automático generado por el sistema.<br>
          <span style="opacity: 0.8;">ID: ${notificationData.incidencia_id.slice(0, 8)}</span>
        </div>
      </div>
    `;

    // Enviar email usando Resend
    try {
      console.log('Attempting to send email via Resend...');
      
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Sistema Monitoreo <soporteit2@grupoesvasa.com>',
          to: admins.map((admin: any) => admin.email),
          subject: emailSubject,
          html: emailBody,
          tags: [
            {
              name: 'category',
              value: 'incident-notification'
            },
            {
              name: 'priority',
              value: notificationData.prioridad
            }
          ]
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error('Resend API error:', resendResponse.status);
        
        // Si es error de dominio no verificado, intentar con dominio por defecto
        if (errorText.includes('domain') || errorText.includes('verified')) {
          console.log('Trying with default verified domain...');
          
          const fallbackResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Sistema Monitoreo <onboarding@resend.dev>',
              to: admins.map((admin: any) => admin.email),
              subject: emailSubject,
              html: emailBody,
              tags: [
                {
                  name: 'category',
                  value: 'incident-notification'
                },
                {
                  name: 'priority',
                  value: notificationData.prioridad
                }
              ]
            }),
          });

          if (fallbackResponse.ok) {
            const emailResponse = await fallbackResponse.json();
            console.log('Email sent successfully with fallback domain');
            
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Notificación enviada exitosamente (dominio alternativo)',
                data: { id: emailResponse.id },
                recipients_count: admins.length,
                email_sent: true,
                note: 'Verifica tu dominio en Resend para mejor deliverabilidad'
              }),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              }
            );
          }
        }
        
        throw new Error(`Resend API error: ${resendResponse.status}`);
      }

      const emailResponse = await resendResponse.json();
      console.log('Email sent successfully');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notificación enviada exitosamente',
          data: { id: emailResponse.id },
          recipients_count: admins.length,
          email_sent: true
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );

    } catch (emailError) {
      console.error('Error sending email:', emailError);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error enviando notificaciones por email',
          recipients_count: admins.length,
          email_sent: false
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

  } catch (error: any) {
    console.error('Unexpected error in send-notification function');
    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
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

