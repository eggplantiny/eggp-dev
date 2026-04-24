import type { APIRoute } from 'astro';

export const prerender = false;

const BUTTONDOWN_ENDPOINT = 'https://api.buttondown.com/v1/subscribers';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
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

  const response = await fetch(BUTTONDOWN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email_address: email.trim() }),
  });

  if (response.ok) {
    return json({ ok: true }, 200);
  }

  // Buttondown returns 400 with { code: 'email_already_exists' } when re-subscribing.
  let code: string | undefined;
  try {
    const data = (await response.json()) as { code?: string; detail?: string };
    code = data.code;
  } catch {
    // ignore body parse errors
  }

  if (code === 'email_already_exists') {
    return json({ ok: true, alreadySubscribed: true }, 200);
  }

  return json({ error: 'Subscription failed. Please try again later.' }, 502);
};
