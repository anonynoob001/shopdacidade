// Shop Carajás - Secure Cross-Platform Auth & Cryptography (Web Crypto API)
import { DatabaseAdapter } from '../db';
import { User, UserRole } from '../types';

export interface AuthSession {
  user: User;
  token: string;
}

// Generates a cryptographically secure hex salt
export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hashes a password using PBKDF2 with SHA-256 (100,000 iterations)
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(key));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
}

export function generateToken(): string {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`.replace(/-/g, '');
}

export async function createSession(db: DatabaseAdapter, userId: string, daysValid = 30): Promise<string> {
  const token = generateToken();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();

  await db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(sessionId, userId, token, expiresAt).run();

  return token;
}

export async function getUserByToken(db: DatabaseAdapter, token?: string): Promise<User | null> {
  if (!token) return null;

  const session = await db.prepare(`
    SELECT s.user_id, s.expires_at, u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1
  `).bind(token).first<any>();

  if (!session) return null;

  const user: User = {
    id: session.id,
    name: session.name,
    email: session.email,
    phone: session.phone,
    role: session.role as UserRole,
    is_active: session.is_active,
    created_at: session.created_at,
    updated_at: session.updated_at
  };

  return user;
}

export async function deleteSession(db: DatabaseAdapter, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}
