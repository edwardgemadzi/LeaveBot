// OTP Storage and Management
// In production, use Redis or a proper database

interface OTPData {
  code: string;
  userId: number;
  username: string;
  expiresAt: number;
  createdAt: number;
}

// Temporary in-memory storage (use Redis in production)
const otpStore = new Map<string, OTPData>();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [username, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(username);
    }
  }
}, 5 * 60 * 1000);

export function generateOTP(): string {
  // Generate 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(username: string, userId: number, code: string): void {
  const now = Date.now();
  otpStore.set(username.toLowerCase(), {
    code,
    userId,
    username: username.toLowerCase(),
    expiresAt: now + 5 * 60 * 1000, // 5 minutes expiry
    createdAt: now,
  });
}

export function verifyOTP(username: string, code: string): { valid: boolean; userId?: number } {
  const stored = otpStore.get(username.toLowerCase());
  
  if (!stored) {
    return { valid: false };
  }

  if (stored.expiresAt < Date.now()) {
    otpStore.delete(username.toLowerCase());
    return { valid: false };
  }

  if (stored.code !== code) {
    return { valid: false };
  }

  // OTP is valid, remove it (one-time use)
  otpStore.delete(username.toLowerCase());
  return { valid: true, userId: stored.userId };
}

export function hasRecentOTP(username: string): boolean {
  const stored = otpStore.get(username.toLowerCase());
  if (!stored) return false;
  
  // Don't allow new OTP if one was sent less than 30 seconds ago
  return Date.now() - stored.createdAt < 30 * 1000;
}
