import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

const KEY_LENGTH = 64;
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.MONGODB_API_KEY
    ? `sportmaker_jwt_secret_${process.env.MONGODB_API_KEY}`
    : crypto.randomBytes(32).toString('hex'));

/**
 * Gera um hash criptográfico seguro para a senha usando `crypto.scrypt` com salt aleatório de 16 bytes.
 * Formato salvo no MongoDB: `scrypt$<salt_hex>$<hash_hex>`
 */
export async function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(plainPassword, salt, KEY_LENGTH);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verifica se a senha em texto plano corresponde ao hash salvo no MongoDB
 * utilizando comparação em tempo constante (`crypto.timingSafeEqual`) contra timing attacks.
 */
export async function verifyPassword(plainPassword, storedPasswordHash) {
  if (!storedPasswordHash || !storedPasswordHash.startsWith('scrypt$')) {
    return false;
  }

  const parts = storedPasswordHash.split('$');
  if (parts.length !== 3) return false;

  const [, salt, keyHex] = parts;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedKey = await scryptAsync(plainPassword, salt, KEY_LENGTH);

  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

/**
 * Assina um token JWT (HS256) contendo o `_id` do MongoDB e o `role` do usuário.
 */
export function signJwtToken(payload, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');

  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Verifica a assinatura e validade de um token JWT (HS256).
 */
export function verifyJwtToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [base64Header, base64Payload, signature] = parts;

    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${base64Header}.${base64Payload}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

