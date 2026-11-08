import {
    startGeneration,
    generationStatus,
    readQuiz,
    startSession,
    readSession,
    recordAnswer,
    readResults,
    listQuizzes,
} from '../services/quizService.js';

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

export async function createSession(req, res) {
    const outcome = await startSession({ userId: req.user.id, quizId: req.params.id });
    res.status(outcome.isNew ? 201 : 200).json({
        session: outcome.session,
        currentQuestion: outcome.currentQuestion,
        answers: outcome.answers,
    });
}

export async function getSession(req, res) {
    const outcome = await readSession({ userId: req.user.id, sessionId: req.params.id });
    res.json(outcome);
}

export async function postAnswer(req, res) {
    const { questionId, optionId } = req.body ?? {};
    const outcome = await recordAnswer({
        userId: req.user.id,
        sessionId: req.params.id,
        questionId,
        optionId,
    });
    res.json(outcome);
}

export async function getResults(req, res) {
    const outcome = await readResults({ userId: req.user.id, sessionId: req.params.id });
    res.json(outcome);
}

export async function getUserQuizzes(req, res) {
    const quizzes = await listQuizzes({ userId: req.user.id });
    res.json({ quizzes });
}
