import rateLimit from 'express-rate-limit';

export default function configureLimiter(app) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  });
  app.use('/api/', limiter);
}
