import helmet from 'helmet';

export default function configureSecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
}
