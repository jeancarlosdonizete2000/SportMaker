/**
 * Utilitário de criptografia de senhas e assinatura no cliente (Web Crypto API - PBKDF2 + SHA-256)
 * Usado para garantir que mesmo no modo Data API ou armazenamento local nenhuma senha
 * seja trafegada ou armazenada em texto puro, e que a verificação seja criptográfica.
 */

const ITERATIONS = 100000;
const HASH_ALGO = 'SHA-256';

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.padStart ? b.toString(16).padStart(2, '0') : ('00' + b.toString(16)).slice(-2))
    .join('');
}

function hexToUint8Array(hexString) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Gera um hash PBKDF2-SHA256 com salt aleatório de 16 bytes via Web Crypto API.
 * Formato: `pbkdf2$<salt_hex>$<hash_hex>`
 */
export async function hashPasswordClient(plainPassword) {
  const encoder = new TextEncoder();
  const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(plainPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    256
  );

  const saltHex = bufferToHex(saltBytes);
  const hashHex = bufferToHex(derivedBits);
  return `pbkdf2$${saltHex}$${hashHex}`;
}

/**
 * Verifica uma senha em texto puro contra um hash `pbkdf2$<salt_hex>$<hash_hex>`
 * usando comparação em tempo constante.
 */
export async function verifyPasswordClient(plainPassword, storedHash) {
  if (!storedHash || !storedHash.startsWith('pbkdf2$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;

  const [, saltHex, expectedHashHex] = parts;
  const encoder = new TextEncoder();
  const saltBytes = hexToUint8Array(saltHex);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(plainPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    256
  );

  const derivedHex = bufferToHex(derivedBits);
  if (derivedHex.length !== expectedHashHex.length) return false;

  // Comparação em tempo constante (XOR) para evitar ataques de timing
  let diff = 0;
  for (let i = 0; i < derivedHex.length; i += 1) {
    diff |= derivedHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return diff === 0;
}

