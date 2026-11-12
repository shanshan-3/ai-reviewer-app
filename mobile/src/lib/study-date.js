/**
 * Device timezone and local study date utilities.
 * Handles daylight saving invariant date strings, weekly calendar calculations, and formatted relative labels.
 */

export function getDeviceTimeZone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
}

export function getLocalStudyDate(date = new Date(), timeZone = getDeviceTimeZone()) {
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

export function formatRelativeStudyDate(dateStr, timeZone = getDeviceTimeZone()) {
    if (!dateStr) return '';
    const todayStr = getLocalStudyDate(new Date(), timeZone);
    if (dateStr === todayStr) return 'Today';

    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));

    try {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
        }).format(dateObj);
    } catch {
        return dateStr;
    }
}

/**
 * Generates the 7 days of the week containing the reference date in the specified timezone.
 * Defaults to starting on Monday (ISO standard for academic schedules).
 *
 * @param {string} [timeZone]
 * @param {Date} [referenceDate]
 * @param {boolean} [startOnMonday=true]
 * @returns {Array<{dateString: string, dayLabel: string, dayNumber: string, isToday: boolean, isPast: boolean, isFuture: boolean}>}
 */
export function getCurrentWeekDays(timeZone = getDeviceTimeZone(), referenceDate = new Date(), startOnMonday = true) {
    const todayStr = getLocalStudyDate(referenceDate, timeZone);
    if (!todayStr) return [];

    const [refY, refM, refD] = todayStr.split('-').map(Number);
    const refUtc = new Date(Date.UTC(refY, refM - 1, refD));
    const dayOfWeek = refUtc.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    let offsetToStart = 0;
    if (startOnMonday) {
        offsetToStart = (dayOfWeek + 6) % 7;
    } else {
        offsetToStart = dayOfWeek;
    }

    const startUtc = new Date(Date.UTC(refY, refM - 1, refD));
    startUtc.setUTCDate(startUtc.getUTCDate() - offsetToStart);

    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startUtc);
        d.setUTCDate(startUtc.getUTCDate() + i);
        const dateString = d.toISOString().slice(0, 10);
        const dayNum = d.getUTCDate();
        const dow = d.getUTCDay();

        week.push({
            dateString,
            dayLabel: DAY_LABELS[dow],
            dayNumber: String(dayNum),
            isToday: dateString === todayStr,
            isPast: dateString < todayStr,
            isFuture: dateString > todayStr,
        });
    }

    return week;
}
