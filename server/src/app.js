import express from 'express';
import profileRoutes from './routes/profileRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import quizRoutes, { studySessionRouter } from './routes/quizRoutes.js';

const app = express();

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/profile', profileRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/study-sessions', studySessionRouter);

export default app;
