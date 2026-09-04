/**
 * Console logging utility with structured formatting, timestamps, and request tracing.
 */

// ANSI Color Codes for clean terminal output
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

/**
 * Get formatted current timestamp string (e.g., 2026-08-31 18:45:12.345)
 */
function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

/**
 * Sanitize request body to prevent logging sensitive data like passwords or tokens.
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'authorization'];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeBody(sanitized[key]);
    }
  }
  return sanitized;
}

/**
 * Get color based on HTTP status code.
 */
function getStatusColor(statusCode) {
  if (statusCode >= 500) return colors.red;
  if (statusCode >= 400) return colors.yellow;
  if (statusCode >= 300) return colors.cyan;
  if (statusCode >= 200) return colors.green;
  return colors.reset;
}

/**
 * Express middleware to log every incoming HTTP request and its response status/duration.
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || ip || req.socket?.remoteAddress;

  // Log on response completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusColor = getStatusColor(statusCode);
    const userContext = req.user ? `[User: ${req.user.email} (${req.user.role})]` : '[Guest]';
    
    const bodyInfo = req.body && Object.keys(req.body).length > 0 && method !== 'GET'
      ? ` | Body: ${JSON.stringify(sanitizeBody(req.body))}`
      : '';

    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ` +
      `${colors.bold}${colors.cyan}${method.padEnd(6)}${colors.reset} ` +
      `${originalUrl} ` +
      `${statusColor}${statusCode}${colors.reset} ` +
      `${colors.dim}(${duration}ms)${colors.reset} ` +
      `${colors.magenta}${userContext}${colors.reset} ` +
      `${colors.dim}IP: ${clientIp}${colors.reset}` +
      `${colors.dim}${bodyInfo}${colors.reset}`
    );
  });

  next();
}

/**
 * General purpose logger
 */
export const logger = {
  info: (message, ...args) => {
    console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.green}[INFO]${colors.reset} ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.red}[ERROR]${colors.reset} ${message}`, ...args);
  },
  debug: (message, ...args) => {
    console.log(`${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.blue}[DEBUG]${colors.reset} ${message}`, ...args);
  },
};

export default logger;
