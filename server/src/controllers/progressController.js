import { getUserRecommendations, getUserEstimates, getUserStreak, getUserReport } from '../services/progressService.js';

export async function getRecommendations(req, res) {
    try {
        const data = await getUserRecommendations({ userId: req.user.id });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Could not load topic recommendations.', code: 'RECOMMENDATIONS_ERROR' });
    }
}

export async function getEstimates(req, res) {
    try {
        const data = await getUserEstimates({ userId: req.user.id });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Could not load practice estimates.', code: 'ESTIMATES_ERROR' });
    }
}

export async function getStreak(req, res) {
    try {
        const timeZone = req.query.tz || req.headers['x-timezone'] || 'UTC';
        const streak = await getUserStreak({ userId: req.user.id, timeZone });
        res.json({ streak });
    } catch (err) {
        res.status(500).json({ error: 'Could not load study streak.', code: 'STREAK_ERROR' });
    }
}

export async function getReport(req, res) {
    try {
        const timeZone = req.query.tz || req.headers['x-timezone'] || 'UTC';
        const report = await getUserReport({ userId: req.user.id, timeZone });
        res.json({ report });
    } catch (err) {
        res.status(500).json({ error: 'Could not generate personal performance report.', code: 'REPORT_ERROR' });
    }
}

