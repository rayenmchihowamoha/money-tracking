import bcrypt from 'bcryptjs';
import { sql, json } from './_db.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const { profileId, pin } = JSON.parse(event.body || '{}');
  if (!profileId || !pin) return json(400, { error: 'Profile and PIN are required.' });

  const rows = await sql`SELECT id, pin_hash FROM profiles WHERE id = ${profileId}`;
  const profile = rows[0];
  if (!profile) return json(401, { error: 'Profile not found.' });

  const valid = await bcrypt.compare(String(pin), profile.pin_hash);
  if (!valid) return json(401, { error: 'Wrong PIN.' });

  const [session] = await sql`
    INSERT INTO sessions (profile_id) VALUES (${profile.id})
    RETURNING token
  `;
  return json(200, { token: session.token, profileId: profile.id });
}
