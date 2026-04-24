import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const audienceId = import.meta.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    return json({ error: 'Newsletter is not configured.' }, 500);
  }

  let email: unknown;
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { email?: unknown };
      email = body.email;
    } else {
      const form = await request.formData();
      email = form.get('email');
    }
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.contacts.create({
    email: email.trim(),
    audienceId,
    unsubscribed: false,
  });

  if (!error) {
    return json({ ok: true }, 200);
  }

  const message = error.message?.toLowerCase() ?? '';
  if (message.includes('already')) {
    return json({ ok: true, alreadySubscribed: true }, 200);
  }

  return json({ error: 'Subscription failed. Please try again later.' }, 502);
};
