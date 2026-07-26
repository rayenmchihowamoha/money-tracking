import { getConnectionString } from '@netlify/database';
import postgres from 'postgres';

// Netlify Database (GA) auto-provisions Postgres and injects the right
// connection string for whichever branch (production / deploy preview)
// this function is running on. getConnectionString() handles that for us.
export const sql = postgres(getConnectionString());

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
