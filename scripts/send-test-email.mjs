import { readFileSync } from 'node:fs';
import { Resend } from 'resend';

// Lightweight .env loader so we don't need a dotenv dependency.
try {
  const contents = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of contents.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '').trim();
  }
} catch {
  // .env is optional; fall back to whatever's already in the environment.
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('RESEND_API_KEY is not set. Add it to .env or export it in your shell.');
  process.exit(1);
}

const resend = new Resend(apiKey);

const to = process.argv[2] ?? 'eggplantiny@gmail.com';

const { data, error } = await resend.emails.send({
  from: 'onboarding@resend.dev',
  to,
  subject: 'Hello World',
  html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
});

if (error) {
  console.error('Resend error:', error);
  process.exit(1);
}

console.log('Sent:', data);
