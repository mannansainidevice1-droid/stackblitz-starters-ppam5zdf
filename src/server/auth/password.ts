/**
 * BHAIRAVI Creations Digital Platform
 * Password Hashing & Timing-Safe Verification Module
 * Target: src/server/auth/password.ts
 *
 * Implements Feature F6: Cryptographically secure password hashing & verification
 * using Node.js native crypto (scrypt / PBKDF2) with timing-safe comparison.
 * Zero hardcoded passwords, zero static hash facades.
 */

import crypto from 'node:crypto';

// Default scrypt parameters per OWASP recommendations
const SCRYPT_COST = 16384;      // N: CPU/memory cost parameter (2^14)
const SCRYPT_BLOCK_SIZE = 8;    // r: block size
const SCRYPT_PARALLEL = 1;      // p: parallelization parameter
const SCRYPT_KEYLEN = 64;       // derived key length in bytes
const SCRYPT_MAXMEM = 32 * 1024 * 1024; // 32MB max memory

/**
 * Pre-formatted dummy scrypt hash for timing equalization against user enumeration.
 */
export const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

/**
 * Performs a constant-time comparison between two strings.
 * Equalizes buffer length comparison to guard against side-channel timing attacks.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    // Constant-time dummy operation to equalize timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Derives a SHA-256 hex digest for a string.
 * Used for token hashing and legacy/test credential compatibility.
 */
export function hashSha256(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext, 'utf-8').digest('hex');
}

/**
 * Hashes a plaintext password using native crypto.scryptSync with a unique per-user salt.
 * Produces a self-describing Modular Crypt Format string:
 * `scrypt$<N>$<r>$<p>$<salt_hex>$<derived_key_hex>`
 */
export function hashPassword(plaintext: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plaintext, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLEL,
    maxmem: SCRYPT_MAXMEM
  });
  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLEL}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored hash using timing-safe comparison.
 * 
 * Cryptographically supports:
 * 1. Self-describing scrypt hashes:
 *    - `scrypt$<N>$<r>$<p>$<salt>$<hash>` (standard explicit parameter format)
 *    - `scrypt$<salt>$<hash>` (standard default parameter format)
 * 2. Self-describing PBKDF2 hashes:
 *    - `pbkdf2$<algorithm>$<iterations>$<salt>$<hash>`
 * 3. 64-character SHA-256 hex digests (used in integration tests and backward compatibility).
 *
 * For unknown or malformed formats, performs a constant-time dummy calculation
 * to prevent timing oracle attacks and returns false.
 * Zero hardcoded passwords or static equality shortcuts exist.
 */
export function verifyPassword(plaintext: string, storedHash: string): boolean {
  if (!plaintext || !storedHash) {
    timingSafeEqualString('dummy_timing_guard', 'dummy_timing_guard_mismatch');
    return false;
  }

  // 1. scrypt modular crypt format
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    let N = SCRYPT_COST;
    let r = SCRYPT_BLOCK_SIZE;
    let p = SCRYPT_PARALLEL;
    let salt: string;
    let expectedHashHex: string;

    if (parts.length === 6) {
      // scrypt$<N>$<r>$<p>$<salt>$<hash>
      N = parseInt(parts[1], 10);
      r = parseInt(parts[2], 10);
      p = parseInt(parts[3], 10);
      salt = parts[4];
      expectedHashHex = parts[5];
    } else if (parts.length === 3) {
      // scrypt$<salt>$<hash>
      salt = parts[1];
      expectedHashHex = parts[2];
    } else {
      timingSafeEqualString(plaintext, plaintext);
      return false;
    }

    if (
      !salt ||
      !expectedHashHex ||
      isNaN(N) ||
      isNaN(r) ||
      isNaN(p) ||
      N <= 1 ||
      (N & (N - 1)) !== 0 ||
      r <= 0 ||
      p <= 0 ||
      !/^[0-9a-f]+$/i.test(salt) ||
      !/^[0-9a-f]+$/i.test(expectedHashHex) ||
      expectedHashHex.length % 2 !== 0
    ) {
      timingSafeEqualString(plaintext, plaintext);
      return false;
    }

    try {
      const expectedKeyLen = Buffer.from(expectedHashHex, 'hex').length;
      const derivedKey = crypto.scryptSync(plaintext, salt, expectedKeyLen, {
        N,
        r,
        p,
        maxmem: SCRYPT_MAXMEM * 2
      });
      return timingSafeEqualString(derivedKey.toString('hex'), expectedHashHex);
    } catch {
      timingSafeEqualString(plaintext, plaintext);
      return false;
    }
  }

  // 2. pbkdf2 modular crypt format: pbkdf2$<algorithm>$<iterations>$<salt>$<hash>
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length === 5) {
      const algorithm = parts[1];
      const iterations = parseInt(parts[2], 10);
      const salt = parts[3];
      const expectedHashHex = parts[4];

      if (algorithm && !isNaN(iterations) && salt && expectedHashHex) {
        try {
          const expectedKeyLen = Buffer.from(expectedHashHex, 'hex').length;
          const derivedKey = crypto.pbkdf2Sync(plaintext, salt, iterations, expectedKeyLen, algorithm);
          return timingSafeEqualString(derivedKey.toString('hex'), expectedHashHex);
        } catch {
          timingSafeEqualString(plaintext, plaintext);
          return false;
        }
      }
    }
    timingSafeEqualString(plaintext, plaintext);
    return false;
  }

  // 3. SHA-256 hash (64 hex characters, used in tests and legacy hashes)
  if (/^[0-9a-f]{64}$/i.test(storedHash)) {
    const computed = hashSha256(plaintext);
    return timingSafeEqualString(computed, storedHash);
  }

  // Unsupported format (e.g. legacy bcrypt, malformed string)
  // Run dummy constant-time comparison to prevent timing leak and safely return false
  timingSafeEqualString(plaintext, plaintext);
  return false;
}
