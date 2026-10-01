import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

export interface EndlessPayload {
  id: number;
  guesses: number[];
}

function key(): Buffer {
  const secret = process.env.TMDB_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'cineclue-endless';
  return createHash('sha256').update(secret).digest();
}

export function signEndless(payload: EndlessPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify({ id: payload.id, guesses: payload.guesses }), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
}

export function readEndless(token: unknown): EndlessPayload | null {
  if (typeof token !== 'string') return null;
  const [ivPart, tagPart, dataPart] = token.split('.');
  if (!ivPart || !tagPart || !dataPart) return null;

  try {
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const json = Buffer.concat([decipher.update(Buffer.from(dataPart, 'base64url')), decipher.final()]).toString('utf8');
    const data = JSON.parse(json) as { id?: unknown; guesses?: unknown };
    const id = Number(data.id);
    if (!Number.isInteger(id) || id <= 0 || !Array.isArray(data.guesses)) return null;
    const guesses = data.guesses
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0)
      .slice(0, 6);
    return { id, guesses };
  } catch {
    return null;
  }
}
