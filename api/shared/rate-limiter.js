// Rate limiting middleware for API endpoints
const rateLimits = new Map();

/**
 * Rate limiter configuration
 * @param {Object} options - Configuration options
 * @param {number} options.maxAttempts - Maximum requests allowed
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.keyGenerator - Function to generate unique key from request
 */
export function createRateLimiter(options = {}) {
  const {
    maxAttempts = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes
    keyGenerator = (req, identifier) => identifier || req.headers['x-forwarded-for'] || 'unknown'
  } = options;

  return function checkRateLimit(req, identifier = null) {
    const key = keyGenerator(req, identifier);
    const now = Date.now();
    const limiterKey = `${key}-${options.endpoint || 'default'}`;
    
    let limitData = rateLimits.get(limiterKey) || {
      count: 0,
      firstRequest: now,
      resetTime: now + windowMs
    };

    // Reset if window has passed
    if (now > limitData.resetTime) {
      limitData = {
        count: 0,
        firstRequest: now,
        resetTime: now + windowMs
      };
    }

    limitData.count++;
    rateLimits.set(limiterKey, limitData);

    const remaining = Math.max(0, maxAttempts - limitData.count);
    const resetInSeconds = Math.ceil((limitData.resetTime - now) / 1000);

    if (limitData.count > maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
        message: `Too many requests. Try again in ${Math.ceil(resetInSeconds / 60)} minutes.`
      };
    }

    return {
      allowed: true,
      remaining,
      resetInSeconds,
      headers: {
        'X-RateLimit-Limit': maxAttempts,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset': Math.floor(limitData.resetTime / 1000)
      }
    };
  };
}

// Preset rate limiters for different endpoint types
export const rateLimiters = {
  // Strict limits for authentication
  auth: createRateLimiter({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    endpoint: 'auth'
  }),

  // Moderate limits for mutations (create, update, delete)
  mutation: createRateLimiter({
    maxAttempts: 50,
    windowMs: 15 * 60 * 1000, // 50 per 15 minutes
    endpoint: 'mutation'
  }),

  // Generous limits for read operations
  read: createRateLimiter({
    maxAttempts: 200,
    windowMs: 15 * 60 * 1000, // 200 per 15 minutes
    endpoint: 'read'
  })
};

// Middleware to apply rate limiting and set headers
export function applyRateLimit(rateLimiter, identifier = null) {
  return (req, res) => {
    const result = rateLimiter(req, identifier);
    
    // Set rate limit headers
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    return result;
  };
}

// Clean up old entries periodically (prevent memory leaks)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimits.entries()) {
    if (now > data.resetTime + 60000) { // Clean up 1 minute after reset
      rateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes
