import bcrypt from 'bcryptjs';
import { sql, json } from './_db.js';

export async function handler(event) {
  if (event.httpMethod === 'GET') {
    const rows = await sql`SELECT id, name FROM profiles ORDER BY created_at ASC`;
    return json(200, rows);
  }

  if (event.httpMethod === 'POST') {
    const { name, pin } = JSON.parse(event.body || '{}');
    if (!name || !pin || String(pin).length < 4) {
      return json(400, { error: 'Name and a PIN of at least 4 characters are required.' });
    }
    const existing = await sql`SELECT id FROM profiles WHERE lower(name) = lower(${name.trim()})`;
    if (existing.length > 0) {
      return json(400, { error: 'That name is already taken. Try a different one.' });
    }
    const pinHash = await bcrypt.hash(String(pin), 10);
    try {
      const [profile] = await sql`
        INSERT INTO profiles (name, pin_hash) VALUES (${name.trim()}, ${pinHash})
        RETURNING id
      `;
      const [session] = await sql`
        INSERT INTO sessions (profile_id) VALUES (${profile.id})
        RETURNING token
      `;
      return json(200, { token: session.token, profileId: profile.id });
    } catch (err) {
      if (err.code === '23505') {
        return json(400, { error: 'That name is already taken. Try a different one.' });
      }
      throw err;
    }
  }

  return json(405, { error: 'Method not allowed' });
}
