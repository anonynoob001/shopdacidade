// Shop Carajás - Secure Cross-Platform Auth & Cryptography (Web Crypto API & TOTP 2FA)
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

  try {
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
      two_factor_enabled: session.two_factor_enabled,
      created_at: session.created_at,
      updated_at: session.updated_at
    };

    return user;
  } catch (err) {
    console.warn('[Shop da Cidade] getUserByToken error (invalid token or uninitialized DB):', err);
    return null;
  }
}

export async function deleteSession(db: DatabaseAdapter, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

// -------------------------------------------------------------
// Two-Factor Authentication (2FA / TOTP RFC 6238)
// Compatible with Google Authenticator, Authy, Microsoft Authenticator
// -------------------------------------------------------------
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTwoFactorSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(str: string): Uint8Array {
  const cleanStr = str.replace(/=+$/, '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < cleanStr.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleanStr[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

export async function calculateTotp(secret: string, offset = 0, epochSec = Math.floor(Date.now() / 1000)): Promise<string> {
  const timeStep = 30;
  const counter = Math.floor(epochSec / timeStep) + offset;
  const counterBytes = new Uint8Array(8);
  let temp = BigInt(counter);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(temp & 0xffn);
    temp >>= 8n;
  }

  const keyBytes = base32Decode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes as any,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBytes as any);
  const hmac = new Uint8Array(signature);
  const hmacOffset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[hmacOffset] & 0x7f) << 24) |
    ((hmac[hmacOffset + 1] & 0xff) << 16) |
    ((hmac[hmacOffset + 2] & 0xff) << 8) |
    (hmac[hmacOffset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export async function verifyTotp(secret: string, userCode: string): Promise<boolean> {
  const cleanCode = userCode.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanCode)) return false;

  for (const offset of [-1, 0, 1]) {
    const validCode = await calculateTotp(secret, offset);
    if (validCode === cleanCode) return true;
  }
  return false;
}

export function getOtpauthUri(secret: string, email: string, issuer = 'Shop da Cidade'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&digits=6&period=30`;
}

export function generateBackupCodes(count = 6): string[] {
  const codes: string[] = [];
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let i = 0; i < count; i++) {
    let code = '';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    for (let j = 0; j < 8; j++) {
      code += chars[bytes[j] % chars.length];
      if (j === 3) code += '-';
    }
    codes.push(code);
  }
  return codes;
}

// -------------------------------------------------------------
// Short-Lived 2FA Temp Tokens (for pending 2FA step in login)
// -------------------------------------------------------------
interface Temp2FAData {
  userId: string;
  expiresAt: number;
}
const temp2FAStore = new Map<string, Temp2FAData>();

export function createTemp2FASession(userId: string): string {
  const tempToken = 't2fa_' + crypto.randomUUID().replace(/-/g, '');
  temp2FAStore.set(tempToken, {
    userId,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
  });
  return tempToken;
}

export function verifyTemp2FASession(tempToken: string): string | null {
  const data = temp2FAStore.get(tempToken);
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    temp2FAStore.delete(tempToken);
    return null;
  }
  temp2FAStore.delete(tempToken);
  return data.userId;
}

// -------------------------------------------------------------
// Rate Limiter for Login (Anti-Brute Force Protection)
// -------------------------------------------------------------
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
}
const loginRateLimitMap = new Map<string, RateLimitRecord>();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; waitMinutes?: number } {
  const record = loginRateLimitMap.get(identifier);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.blockedUntil > now) {
    const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  if (record.blockedUntil <= now && record.attempts >= 5) {
    // Reset after block expires
    loginRateLimitMap.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string): void {
  const record = loginRateLimitMap.get(identifier) || { attempts: 0, blockedUntil: 0 };
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.blockedUntil = Date.now() + 10 * 60 * 1000; // 10 minutes block
  }
  loginRateLimitMap.set(identifier, record);
}

export function clearFailedLogin(identifier: string): void {
  loginRateLimitMap.delete(identifier);
}
