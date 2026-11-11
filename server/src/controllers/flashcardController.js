import {
    createFlashcardSet,
    listFlashcardSets,
    readFlashcardSet,
    recordFlashcardCompletion,
    removeFlashcardSet,
} from '../services/flashcardService.js';

export async function generateDeck(req, res, next) {
    try {
        const result = await createFlashcardSet({ userId: req.user.id, body: req.body });
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function getUserDecks(req, res, next) {
    try {
        const result = await listFlashcardSets({ userId: req.user.id });
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function getDeck(req, res, next) {
    try {
        const result = await readFlashcardSet({ userId: req.user.id, setId: req.params.id });
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function postReview(req, res, next) {
    try {
        const { viewedCardCount } = req.body ?? {};
        const result = await recordFlashcardCompletion({
            userId: req.user.id,
            setId: req.params.id,
            viewedCardCount: Number(viewedCardCount) || 0,
        });
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function deleteDeck(req, res, next) {
    try {
        const result = await removeFlashcardSet({ userId: req.user.id, setId: req.params.id });
        res.json(result);
    } catch (err) {
        next(err);
    }
}
