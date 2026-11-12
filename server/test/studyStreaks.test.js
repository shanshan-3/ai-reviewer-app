import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStreak, getLocalDateString, getPreviousDateString } from '../src/services/studyStreaks.js';

test('getLocalDateString formats dates properly across timezones', () => {
    // 2026-11-12T01:00:00Z is 2026-11-12 in Manila (UTC+8) and 2026-11-11 in New York (UTC-5)
    const ts = '2026-11-12T01:00:00.000Z';
    assert.equal(getLocalDateString(ts, 'Asia/Manila'), '2026-11-12');
    assert.equal(getLocalDateString(ts, 'America/New_York'), '2026-11-11');
    assert.equal(getLocalDateString(ts, 'UTC'), '2026-11-12');
});

test('getPreviousDateString handles month and year rollovers', () => {
    assert.equal(getPreviousDateString('2026-11-12'), '2026-11-11');
    assert.equal(getPreviousDateString('2026-03-01'), '2026-02-28');
    assert.equal(getPreviousDateString('2026-01-01'), '2025-12-31');
});

test('calculateStreak returns 0 for empty or invalid timestamps', () => {
    const res = calculateStreak([], 'UTC');
    assert.equal(res.currentStreak, 0);
    assert.equal(res.longestStreak, 0);
    assert.equal(res.hasStudiedToday, false);
    assert.equal(res.totalStudyDays, 0);
    assert.equal(res.lastStudiedDate, null);
});

test('calculateStreak counts 1 day when user studied today only', () => {
    const ref = new Date('2026-11-12T10:00:00.000Z');
    const ts = ['2026-11-12T08:00:00.000Z', '2026-11-12T09:00:00.000Z']; // duplicates on same day
    const res = calculateStreak(ts, 'UTC', ref);
    assert.equal(res.currentStreak, 1);
    assert.equal(res.longestStreak, 1);
    assert.equal(res.hasStudiedToday, true);
    assert.equal(res.totalStudyDays, 1);
    assert.equal(res.lastStudiedDate, '2026-11-12');
});

test('calculateStreak preserves streak when studied yesterday but not yet today', () => {
    const ref = new Date('2026-11-12T10:00:00.000Z');
    const ts = ['2026-11-11T14:00:00.000Z', '2026-11-10T12:00:00.000Z'];
    const res = calculateStreak(ts, 'UTC', ref);
    assert.equal(res.currentStreak, 2);
    assert.equal(res.longestStreak, 2);
    assert.equal(res.hasStudiedToday, false);
    assert.equal(res.totalStudyDays, 2);
    assert.equal(res.lastStudiedDate, '2026-11-11');
});

test('calculateStreak breaks streak if yesterday was missed', () => {
    const ref = new Date('2026-11-12T10:00:00.000Z');
    const ts = ['2026-11-10T12:00:00.000Z', '2026-11-09T12:00:00.000Z'];
    const res = calculateStreak(ts, 'UTC', ref);
    assert.equal(res.currentStreak, 0);
    assert.equal(res.longestStreak, 2);
    assert.equal(res.hasStudiedToday, false);
    assert.equal(res.totalStudyDays, 2);
});

test('calculateStreak tracks longest streak across historical gaps', () => {
    const ref = new Date('2026-11-12T10:00:00.000Z');
    const ts = [
        '2026-11-12T08:00:00.000Z',
        '2026-11-11T08:00:00.000Z',
        '2026-10-15T08:00:00.000Z',
        '2026-10-14T08:00:00.000Z',
        '2026-10-13T08:00:00.000Z',
        '2026-10-12T08:00:00.000Z',
    ];
    const res = calculateStreak(ts, 'UTC', ref);
    assert.equal(res.currentStreak, 2);
    assert.equal(res.longestStreak, 4);
    assert.equal(res.hasStudiedToday, true);
    assert.equal(res.totalStudyDays, 6);
});
