import type { APIRoute } from 'astro';

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

  const response = await fetch(
    `https://api.resend.com/audiences/${audienceId}/contacts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), unsubscribed: false }),
    }
  );

  let data: { id?: string; name?: string; message?: string } = {};
  try {
    data = await response.json();
  } catch {
    // ignore body parse errors
  }

  if (response.ok) {
    return json({ ok: true }, 200);
  }

  // Resend signals duplicates via validation_error with a message mentioning existence.
  const message = data.message?.toLowerCase() ?? '';
  if (data.name === 'validation_error' && message.includes('already')) {
    return json({ ok: true, alreadySubscribed: true }, 200);
  }

  return json({ error: 'Subscription failed. Please try again later.' }, 502);
};
