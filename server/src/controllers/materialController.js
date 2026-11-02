import { importMaterial, readMaterial } from '../services/materialService.js';

export async function uploadMaterial(req, res) {
    const material = await importMaterial({ userId: req.user.id, supabase: req.supabase,
        bytes: req.body, ...req.materialUpload });
    res.status(201).json({ material });
}

export async function getMaterial(req, res) {
    const result = await readMaterial({ userId: req.user.id, supabase: req.supabase, id: req.params.id });
    res.json(result);
}
