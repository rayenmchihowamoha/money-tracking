import { neon } from '@neondatabase/serverless';

// Netlify DB (the built-in Neon integration) sets NETLIFY_DATABASE_URL
// automatically once you enable it in your site's Netlify dashboard
// (Extensions -> Netlify DB). DATABASE_URL is a fallback for local dev.
const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('No database connection string found. Set NETLIFY_DATABASE_URL.');
}

export const sql = neon(connectionString);

export function json(statusCode, data) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

export function pathSegmentsAfter(event, functionName) {
  // event.path looks like /.netlify/functions/<name>/<extra>/<segments>
  const marker = `/${functionName}`;
  const idx = event.path.indexOf(marker);
  const rest = idx >= 0 ? event.path.slice(idx + marker.length) : '';
  return rest.split('/').filter(Boolean);
}
