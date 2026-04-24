export default function configureAPI(app) {
  app.get('/api', (req, res) => {
    res.json({
      message: 'Emergency Call Exchange API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        calls: '/api/calls',
        health: '/health'
      }
    });
  });
}
