import express from 'express';
import profileRoutes from './routes/profileRoutes.js';

const app = express();

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/profile', profileRoutes);


export default app;
