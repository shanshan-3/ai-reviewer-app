import express from 'express';
import profileRoutes from './routes/profileRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import quizRoutes from './routes/quizRoutes.js';

const app = express();

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/profile', profileRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/quizzes', quizRoutes);


export default app;
