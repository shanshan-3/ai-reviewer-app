import { importMaterial, readMaterial, listMaterials as list, approveMaterial as approve } from '../services/materialService.js';
import { deleteMaterial as remove } from '../services/materialDeletion.js';

export async function uploadMaterial(req, res) {
    const material = await importMaterial({ userId: req.user.id, supabase: req.supabase,
        bytes: req.body, ...req.materialUpload });
    res.status(201).json({ material });
}

export async function getMaterial(req, res) {
    const result = await readMaterial({ userId: req.user.id, supabase: req.supabase, id: req.params.id });
    res.json(result);
}

export async function listMaterials(req, res) {
    res.json(await list({ userId: req.user.id, supabase: req.supabase, offset: req.query.offset }));
}

export async function deleteMaterial(req, res) {
    await remove({ userId: req.user.id, id: req.params.id });
    res.json({ status: 'deleted' });
}

export async function approveMaterial(req, res) {
    await approve({ userId: req.user.id, id: req.params.id, body: req.body });
    res.json({ status: 'ready' });
}
