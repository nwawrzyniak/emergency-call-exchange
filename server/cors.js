import cors from 'cors';

export default function configureCors(app) {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }));
}
