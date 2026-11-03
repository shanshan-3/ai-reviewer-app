import { readLabels, addLabel } from '../services/labelService.js';

export async function getLabels(req, res) {
    res.json(await readLabels({ userId: req.user.id, supabase: req.supabase }));
}

export async function createSubject(req, res) {
    res.status(201).json({ label: await addLabel({ userId: req.user.id, supabase: req.supabase, kind: 'subjects', body: req.body }) });
}

export async function createTopic(req, res) {
    res.status(201).json({ label: await addLabel({ userId: req.user.id, supabase: req.supabase, kind: 'topics', body: req.body }) });
}
