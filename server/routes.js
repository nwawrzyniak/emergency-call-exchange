import authRoutes from '../routes/auth.js';
import userRoutes from '../routes/users.js';
import callRoutes from '../routes/calls.js';

export default function configureRoutes(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/calls', callRoutes);
}
