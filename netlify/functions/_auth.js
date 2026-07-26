import { sql, json } from './_db.js';

export async function getProfileId(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  const rows = await sql`SELECT profile_id FROM sessions WHERE token = ${token}`;
  return rows[0]?.profile_id || null;
}

export function unauthorized() {
  return json(401, { error: 'Not logged in. Please unlock your profile again.' });
}
