import { sequelize } from '../models/index.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function connectDatabaseAndStartServer(app) {
  const PORT = process.env.PORT || 3000;

  sequelize.sync({ alter: true })
    .then(() => {
      console.log('Database synced successfully');
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Serving static files from: ${join(__dirname, '../public')}`);
      });
    })
    .catch(err => {
      console.error('Database sync error:', err);
      process.exit(1);
    });
}
