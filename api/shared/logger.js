// Environment-aware structured logger
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const isDevelopment = process.env.NODE_ENV !== 'production';
const currentLevel = isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };

  // In production, output JSON for log aggregation
  if (!isDevelopment) {
    return JSON.stringify(logEntry);
  }

  // In development, pretty print
  const emoji = {
    ERROR: '❌',
    WARN: '⚠️',
    INFO: 'ℹ️',
    DEBUG: '🔍'
  }[level] || '📝';

  let output = `${emoji} [${timestamp}] ${level}: ${message}`;
  if (Object.keys(meta).length > 0) {
    output += '\n' + JSON.stringify(meta, null, 2);
  }
  return output;
}

export const logger = {
  error(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, meta));
    }
  },

  warn(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, meta));
    }
  },

  info(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(formatLog('INFO', message, meta));
    }
  },

  debug(message, meta = {}) {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatLog('DEBUG', message, meta));
    }
  },

  // Special method for API request logging
  request(req, meta = {}) {
    this.info('API Request', {
      method: req.method,
      url: req.url,
      ip: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      ...meta
    });
  },

  // Special method for API response logging
  response(req, res, duration, meta = {}) {
    this.info('API Response', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ...meta
    });
  }
};
