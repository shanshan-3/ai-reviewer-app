import test from 'node:test';
import assert from 'node:assert/strict';
import { getCurrentWeekDays, getLocalStudyDate, formatRelativeStudyDate } from '../src/lib/study-date.js';

test('getCurrentWeekDays returns exactly 7 days starting from Monday', () => {
    // Thursday, Nov 12, 2026
    const ref = new Date('2026-11-12T10:00:00.000Z');
    const week = getCurrentWeekDays('UTC', ref, true);

    assert.equal(week.length, 7);
    assert.equal(week[0].dayLabel, 'Mon');
    assert.equal(week[0].dateString, '2026-11-09');

    assert.equal(week[3].dayLabel, 'Thu');
    assert.equal(week[3].dateString, '2026-11-12');
    assert.equal(week[3].isToday, true);
    assert.equal(week[3].isPast, false);
    assert.equal(week[3].isFuture, false);

    assert.equal(week[6].dayLabel, 'Sun');
    assert.equal(week[6].dateString, '2026-11-15');
    assert.equal(week[6].isFuture, true);
});

test('getCurrentWeekDays correctly handles Sunday reference date with Monday start', () => {
    // Sunday, Nov 15, 2026
    const ref = new Date('2026-11-15T12:00:00.000Z');
    const week = getCurrentWeekDays('UTC', ref, true);

    assert.equal(week.length, 7);
    assert.equal(week[0].dateString, '2026-11-09');
    assert.equal(week[0].dayLabel, 'Mon');
    assert.equal(week[6].dateString, '2026-11-15');
    assert.equal(week[6].dayLabel, 'Sun');
    assert.equal(week[6].isToday, true);
});

test('getCurrentWeekDays correctly crosses month boundaries', () => {
    // Tuesday, Dec 1, 2026 (Monday was Nov 30)
    const ref = new Date('2026-12-01T12:00:00.000Z');
    const week = getCurrentWeekDays('UTC', ref, true);

    assert.equal(week.length, 7);
    assert.equal(week[0].dateString, '2026-11-30');
    assert.equal(week[0].dayNumber, '30');
    assert.equal(week[0].dayLabel, 'Mon');

    assert.equal(week[1].dateString, '2026-12-01');
    assert.equal(week[1].dayNumber, '1');
    assert.equal(week[1].isToday, true);
});
