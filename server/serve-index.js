import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function configureServeIndex(app) {
  app.get('*path', (req, res) => {
    res.sendFile(join(__dirname, '../public', 'index.html'));
  });
}
