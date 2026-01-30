import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TestEmailRequest {
  host: string;
  port: string;
  username: string;
  password: string;
  useTls: boolean;
  useSsl: boolean;
  recipients: string[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Test email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const { recipients }: TestEmailRequest = await req.json();

    console.log("Sending test email to:", recipients);

    // Validate required fields
    if (!recipients || recipients.length === 0) {
      throw new Error("Pelo menos um destinatário é obrigatório");
    }

    // Filter out empty recipients
    const validRecipients = recipients.filter(r => r && r.trim().length > 0);
    
    if (validRecipients.length === 0) {
      throw new Error("Nenhum destinatário válido encontrado");
    }

    // Send test email using Resend
    const emailResponse = await resend.emails.send({
      from: "TECHUB Monitor <onboarding@resend.dev>",
      to: validRecipients,
      subject: "[TECHUB Monitor] Teste de envio de email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
            ✅ Teste de Email
          </h1>
          <p style="font-size: 16px; color: #555;">
            Este é um email de teste enviado com sucesso pelo <strong>TECHUB Monitor</strong>.
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">
              <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
          </div>
          <p style="font-size: 14px; color: #888; margin-top: 30px;">
            Se você recebeu este email, as configurações de email estão funcionando corretamente.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #aaa;">
            TECHUB Monitor · Sistema de Monitoramento Corporativo
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de teste enviado com sucesso!",
        id: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending test email:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro desconhecido ao enviar email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
