/**
 * Study streaks service: calculates qualifying recorded study dates,
 * current consecutive streak, longest streak, and daily completion status.
 *
 * A calendar date qualifies if:
 * 1. A quiz session is completed (study_sessions.status = 'completed')
 * 2. Every card back in a flashcard set has been viewed that day (flashcard_reviews)
 */

/**
 * Formats a Date or ISO timestamp into YYYY-MM-DD in the given IANA timezone.
 * Defaults to UTC if the timezone is invalid.
 */
export function getLocalDateString(date, timeZone = 'UTC') {
    try {
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return null;
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(d);
    } catch {
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 10);
    }
}

/**
 * Returns the calendar date string (YYYY-MM-DD) 1 day before the provided date string.
 * Uses Date.UTC to guarantee daylight savings invariant arithmetic.
 */
export function getPreviousDateString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const [year, month, day] = parts;
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}

/**
 * Calculates current streak, longest streak, total study days, and today's status.
 *
 * @param {Array<string|Date>} completedTimestamps - timestamps of completed quizzes and flashcard reviews
 * @param {string} timeZone - client's IANA timezone (e.g. 'Asia/Manila', 'America/New_York')
 * @param {Date} [referenceDate] - optional date override for testing
 */
export function calculateStreak(completedTimestamps = [], timeZone = 'UTC', referenceDate = new Date()) {
    if (!Array.isArray(completedTimestamps) || completedTimestamps.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            hasStudiedToday: false,
            totalStudyDays: 0,
            lastStudiedDate: null,
            recentDays: [],
        };
    }

    const dateSet = new Set();
    for (const ts of completedTimestamps) {
        const dateStr = getLocalDateString(ts, timeZone);
        if (dateStr) dateSet.add(dateStr);
    }

    if (dateSet.size === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            hasStudiedToday: false,
            totalStudyDays: 0,
            lastStudiedDate: null,
            recentDays: [],
        };
    }

    const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a)); // Descending YYYY-MM-DD
    const todayStr = getLocalDateString(referenceDate, timeZone);
    const yesterdayStr = getPreviousDateString(todayStr);

    const hasStudiedToday = dateSet.has(todayStr);

    // Current streak:
    // If the user studied today, streak counts backwards starting today.
    // If user has NOT studied today, but studied yesterday, the streak is preserved counting backwards from yesterday.
    // Otherwise, streak is 0.
    let currentStreak = 0;
    let checkDate = hasStudiedToday ? todayStr : (dateSet.has(yesterdayStr) ? yesterdayStr : null);

    while (checkDate && dateSet.has(checkDate)) {
        currentStreak++;
        checkDate = getPreviousDateString(checkDate);
    }

    // Longest streak: max consecutive calendar days in user's history
    let longestStreak = 0;
    let tempStreak = 0;
    let expectedNext = null;

    for (const d of sortedDates) {
        if (!expectedNext || d === expectedNext) {
            tempStreak++;
        } else {
            tempStreak = 1;
        }
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
        }
        expectedNext = getPreviousDateString(d);
    }

    return {
        currentStreak,
        longestStreak,
        hasStudiedToday,
        totalStudyDays: dateSet.size,
        lastStudiedDate: sortedDates[0],
        recentDays: sortedDates.slice(0, 14),
    };
}
