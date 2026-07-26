import { getConnectionString } from '@netlify/database';
import postgres from 'postgres';

// Netlify Database (GA) is supposed to auto-provision Postgres and inject
// the right connection string for whichever branch (production / deploy
// preview) this function is running on. If that auto-injection isn't
// working in this environment, fall back to a manually-set DATABASE_URL
// environment variable (copied from the Netlify Database dashboard).
let connectionString;
try {
  connectionString = getConnectionString();
} catch (err) {
  connectionString = null;
}
if (!connectionString) {
  connectionString = process.env.DATABASE_URL;
}
if (!connectionString) {
  throw new Error(
    'No database connection string available. Set a DATABASE_URL environment variable in Netlify (Project configuration → Environment variables) with the connection string copied from the Database dashboard.'
  );
}

export const sql = postgres(connectionString);

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
