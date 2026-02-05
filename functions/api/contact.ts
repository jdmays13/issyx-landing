interface Env {
  RESEND_API_KEY: string;
  CONTACT_EMAIL?: string;
}

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  deviceCount?: string;
  interest?: string;
  message?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function handleContactCors(): Response {
  return new Response(null, { headers: corsHeaders });
}

export async function handleContactForm(request: Request, env: Env): Promise<Response> {
  try {
    // Check if API key is configured
    if (!env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Please email us directly at sales@issyx.com' }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const body = (await request.json()) as ContactForm;

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email || !body.company) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const contactEmail = env.CONTACT_EMAIL || 'sales@issyx.com';

    // Send notification email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Issyx Website <noreply@issyx.com>',
        to: [contactEmail],
        reply_to: body.email,
        subject: `New Demo Request: ${body.firstName} ${body.lastName} — ${body.company}`,
        html: `
          <h2>New Demo Request from issyx.com</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold;">Name</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(body.firstName)} ${escapeHtml(body.lastName)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold;">Email</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;"><a href="mailto:${escapeHtml(body.email)}">${escapeHtml(body.email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold;">Company</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(body.company)}</td>
            </tr>
            ${body.deviceCount ? `<tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold;">Device Count</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(body.deviceCount)}</td>
            </tr>` : ''}
            ${body.interest ? `<tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold;">Interest</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(body.interest)}</td>
            </tr>` : ''}
            ${body.message ? `<tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; font-weight: bold;">Message</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${escapeHtml(body.message)}</td>
            </tr>` : ''}
          </table>
          <br>
          <p style="color: #666; font-size: 12px;">
            Submitted from issyx.com contact form at ${new Date().toISOString()}
          </p>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error('Resend API error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send message. Please email us directly at sales@issyx.com' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // TODO: Add ERPNext CRM Lead creation here when ready
    // const erpResponse = await fetch('https://erp.issyx.com/api/resource/Lead', {
    //   method: 'POST',
    //   headers: { 'Authorization': `token ${env.ERP_API_KEY}` },
    //   body: JSON.stringify({
    //     lead_name: `${body.firstName} ${body.lastName}`,
    //     email_id: body.email,
    //     company_name: body.company,
    //     source: 'Website',
    //     notes: body.message,
    //   }),
    // });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('Contact form error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
