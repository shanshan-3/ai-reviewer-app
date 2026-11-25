export function quizError(status, code, message) {
    return Object.assign(new Error(message), { status, code, publicMessage: message });
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const keys = (value, allowed) => plain(value) && Object.keys(value).every(key => allowed.includes(key));
const nonempty = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

export function validateQuizId(value) {
    if (typeof value !== 'string' || !uuid.test(value)) throw quizError(400, 'INVALID_QUIZ_REQUEST', 'Provide a valid ID.');
    return value.toLowerCase();
}

export function validateGenerationRequest(body) {
    if (!keys(body, ['requestId', 'source', 'questionType', 'questionCount', 'startingDifficulty'])
        || !plain(body.source)) throw quizError(400, 'INVALID_QUIZ_REQUEST', 'Provide a source and quiz choices.');
    const kind = body.source.kind;
    const idKey = kind === 'module' ? 'materialId' : 'topicId';
    if (!['module', 'topic'].includes(kind) || !keys(body.source, ['kind', idKey])) {
        throw quizError(400, 'INVALID_QUIZ_REQUEST', 'Choose exactly one module or topic.');
    }
    const sourceId = validateQuizId(body.source[idKey]);
    const type = body.questionType === undefined ? 'conceptual' : body.questionType;
    const count = body.questionCount === undefined ? 10 : body.questionCount;
    const difficulty = body.startingDifficulty === undefined ? 'medium' : body.startingDifficulty;
    if (!['conceptual', 'true_false', 'coding_syntax'].includes(type) || ![5, 10, 20].includes(count)
        || !['easy', 'medium', 'hard'].includes(difficulty)) {
        throw quizError(400, 'INVALID_QUIZ_REQUEST', 'Choose 5, 10, or 20 questions, a supported type and difficulty.');
    }
    return { request_id: validateQuizId(body.requestId), source_kind: kind, material_id: kind === 'module' ? sourceId : null,
        topic_id: kind === 'topic' ? sourceId : null, question_type: type, requested_question_count: count, starting_difficulty: difficulty };
}

export function sameGenerationInput(row, request) {
    return ['request_id', 'source_kind', 'material_id', 'question_type', 'requested_question_count', 'starting_difficulty']
        .every(key => row[key] === request[key]) && (request.source_kind === 'module' || row.topic_id === request.topic_id);
}

const normalizeChar = ch => ch === '‘' || ch === '’' ? '\'' : ch === '“' || ch === '”' ? '"' : ch === '–' || ch === '—' ? '-' : ch.toLowerCase();

function normalizeForMatch(value) {
    let norm = '';
    const starts = [];
    const ends = [];
    let pendingSpace = false;
    let spaceStart = -1;
    let spaceEnd = -1;
    for (let i = 0; i < value.length; i++) {
        const ch = value[i];
        if (/\s/.test(ch)) {
            if (norm.length > 0 && !pendingSpace) {
                pendingSpace = true;
                spaceStart = i;
            }
            spaceEnd = i + 1;
            continue;
        }
        if (pendingSpace) {
            norm += ' ';
            starts.push(spaceStart);
            ends.push(spaceEnd);
            pendingSpace = false;
        }
        norm += normalizeChar(ch);
        starts.push(i);
        ends.push(i + 1);
    }
    return { norm, starts, ends };
}

function findVerbatimSpan(text, rawExcerpt) {
    if (typeof text !== 'string' || !text) return null;
    const exact = text.indexOf(rawExcerpt);
    if (exact >= 0 && rawExcerpt.length <= 1500) {
        return { start: exact, end: exact + rawExcerpt.length };
    }
    const { norm: haystack, starts, ends } = normalizeForMatch(text);
    const cleaned = rawExcerpt.replace(/^(?:\.\.\.|…)+|(?:\.\.\.|…)+$/g, '').replace(/^["'“‘]+|["'”’]+$/g, '').trim();
    const candidates = [cleaned, ...cleaned.split(/(?:\.\.\.|…|\n|;\s|\.\s+)/).map(s => s.trim()).filter(s => s.length >= 20)]
        .filter((s, idx, arr) => s.length > 0 && arr.indexOf(s) === idx);
    for (const candidate of candidates) {
        const { norm: needle } = normalizeForMatch(candidate);
        if (!needle) continue;
        const pos = haystack.indexOf(needle);
        if (pos >= 0) {
            const start = starts[pos];
            const end = ends[pos + needle.length - 1];
            if (end - start > 0 && end - start <= 1500) return { start, end };
        }
    }
    return null;
}

function matchCitation(sections, citation) {
    if (!keys(citation, ['sectionId', 'excerpt']) || !nonempty(citation.excerpt, 1500)) return null;
    const preferred = sections.find(item => item.id === citation.sectionId);
    const ordered = preferred ? [preferred, ...sections.filter(item => item.id !== preferred.id)] : sections;
    for (const section of ordered) {
        const span = findVerbatimSpan(section.text, citation.excerpt);
        if (span) return { section, ...span };
    }
    return null;
}

export function validateGeneratedQuestions(output, settings, sections) {
    const invalid = () => { throw quizError(422, 'INVALID_GENERATION', 'The generated quiz did not pass validation. Try again.'); };
    if (!keys(output, ['outcome', 'questions']) || !['ready', 'insufficient_source', 'unsupported_topic'].includes(output.outcome)
        || !Array.isArray(output.questions)) invalid();
    if (output.questions.length > settings.requested_question_count) {
        output.questions = output.questions.slice(0, settings.requested_question_count);
    }
    if (output.outcome !== 'ready') {
        if (output.questions.length) invalid();
        return { questions: [], code: output.outcome === 'unsupported_topic' ? 'UNSUPPORTED_TOPIC'
            : settings.question_type === 'coding_syntax' ? 'CODE_SOURCE_REQUIRED' : 'INSUFFICIENT_SOURCE' };
    }
    if (!output.questions.length) invalid();
    const optionIds = settings.question_type === 'true_false' ? ['a', 'b'] : ['a', 'b', 'c', 'd'];
    const seen = new Set();
    const questions = [];
    for (const question of output.questions) {
        if (!keys(question, ['prompt', 'difficulty', 'code', 'options', 'correctOptionId', 'explanation', 'sources'])
            || !nonempty(question.prompt, 1600) || !nonempty(question.explanation, 2000)
            || !['easy', 'medium', 'hard'].includes(question.difficulty)
            || !Array.isArray(question.options) || question.options.length !== optionIds.length || !Array.isArray(question.sources)
            || !optionIds.includes(question.correctOptionId)) invalid();
        if (settings.question_type !== 'coding_syntax' ? question.code !== null
            : !keys(question.code, ['language', 'text']) || !nonempty(question.code.language, 40) || !nonempty(question.code.text, 3000)) invalid();
        const fingerprint = question.prompt.trim().replace(/\s+/g, ' ').toLowerCase() + '\n' + (question.code?.text.trim() ?? '');
        if (seen.has(fingerprint)) continue;
        seen.add(fingerprint);
        const options = new Map();
        for (const option of question.options) {
            if (!keys(option, ['id', 'text']) || !optionIds.includes(option.id)
                || options.has(option.id) || !nonempty(option.text, 1000)) invalid();
            options.set(option.id, option.text.trim());
        }
        if (new Set([...options.values()].map(value => value.toLowerCase())).size !== optionIds.length) invalid();
        if (settings.question_type === 'true_false' && (options.get('a') !== 'True' || options.get('b') !== 'False')) invalid();
        if (settings.source_kind === 'topic' && question.sources.length) invalid();
        if (settings.source_kind === 'module' && question.sources.length > 20) invalid();
        const cited = new Map();
        for (const citation of question.sources) {
            const matched = matchCitation(sections, citation);
            if (!matched) continue;
            const previous = cited.get(matched.section.id);
            const start = Math.min(previous?.start ?? matched.start, matched.start);
            const end = Math.max(previous?.end ?? 0, matched.end);
            if (end - start <= 1500) cited.set(matched.section.id, { section: matched.section, start, end });
        }
        if (settings.source_kind === 'module' && !cited.size) continue;
        const sources = [...cited.values()].map(({ section, start, end }) => ({
            section_id: section.id, reference: section.reference, excerpt: section.text.slice(start, end),
        }));
        questions.push({ prompt: question.prompt.trim(), difficulty: question.difficulty,
            code: question.code?.text ?? null, code_language: question.code?.language ?? null,
            option_a: options.get('a'), option_b: options.get('b'), option_c: options.get('c') ?? null, option_d: options.get('d') ?? null,
            correct_option_id: question.correctOptionId, explanation: question.explanation.trim(), sources });
    }
    if (!questions.length) {
        if (settings.source_kind === 'module') {
            return { questions: [], code: settings.question_type === 'coding_syntax' ? 'CODE_SOURCE_REQUIRED' : 'INSUFFICIENT_SOURCE' };
        }
        invalid();
    }
    const targetDifficulty = settings.starting_difficulty || 'medium';
    if (questions.some(question => question.difficulty !== targetDifficulty)) invalid();
    return { questions, code: null };
}
