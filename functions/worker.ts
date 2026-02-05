import { handleContactForm, handleContactCors } from './api/contact';

interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  CONTACT_EMAIL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle /api/contact
    if (url.pathname === '/api/contact') {
      if (request.method === 'OPTIONS') {
        return handleContactCors();
      }
      if (request.method === 'POST') {
        return handleContactForm(request, env);
      }
      return new Response('Method not allowed', { status: 405 });
    }

    // Everything else: serve static assets
    return env.ASSETS.fetch(request);
  },
};
