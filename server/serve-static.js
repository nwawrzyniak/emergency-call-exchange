import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function configureServeStatic(app) {
  app.use(express.json());
  app.use(express.static(join(__dirname, '../public')));
}
