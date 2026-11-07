import { startGeneration, generationStatus, readQuiz } from '../services/quizService.js';

export async function generateQuiz(req, res) {
    const row = await startGeneration({ userId: req.user.id, body: req.body });
    const generation = await generationStatus({ userId: req.user.id, row });
    res.status(generation.status === 'processing' ? 202 : 200).json({ generation });
}
export async function getGeneration(req, res) {
    res.json({ generation: await generationStatus({ userId: req.user.id, id: req.params.id }) });
}
export async function getQuiz(req, res) {
    res.json({ quiz: await readQuiz({ userId: req.user.id, id: req.params.id }) });
}
