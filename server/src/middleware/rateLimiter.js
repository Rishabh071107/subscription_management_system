/**
 * In-memory sliding window rate limiter
 */
const rateLimitMap = new Map();

export const rateLimiter = ({ windowMs = 15 * 60 * 1000, max = 30, message = 'Too many requests. Please try again later.' } = {}) => {
  return (req, res, next) => {
    // In test environment, do not throttle tests
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${req.baseUrl || ''}${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(key, record);

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message
      });
    }

    next();
  };
};

