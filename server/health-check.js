export default function configureHealthCheck(app) {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });
}
