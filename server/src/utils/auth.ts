import crypto from "crypto";

const SALT_ROUNDS = 10;
const TOKEN_LENGTH = 32;

// Simple password hashing using crypto (production should use bcrypt)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

export function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

export function generateTokenExpiry(): string {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
  return expiryDate.toISOString();
}
