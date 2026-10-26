import { describe, expect, it } from 'vitest';
import { cleanStore, emptyStore, packState, RETENTION_MS, type Outing } from '../src/core/model';
import { eligiblePosition, queuePosition, resumeSharing, stopSharing, type SharingState } from '../src/core/sync';
const now = 1000000;
const position = { latitude: 45, longitude: 10, accuracy: 10, observedAt: now };
const state: SharingState = { mode: 'active', eligibleAfter: now - 1, expiresAt: now + 3600000 };
const membership = { authorized: true, identityVerified: true, reconciled: true, outingEndsAt: now + 3600000 };
describe('sharing queue policy — A03/A04/A05/A06', () => {
  it('coalesces to the latest observation and preserves its original time', () => {
    let s = queuePosition(state, position, now); s = queuePosition(s, { ...position, observedAt: now + 100 }, now + 100); s = queuePosition(s, position, now + 200);
    expect(s.pending?.observedAt).toBe(now + 100);
  });
  it.each(['off', 'paused'] as const)('stop %s discards queued locations', mode => { const s = stopSharing(queuePosition(state, position, now), now + 10, mode); expect(s.pending).toBeUndefined(); expect(eligiblePosition(s, membership, now + 20)).toBeUndefined(); });
  it('resuming requires a newly observed position', () => { const s = resumeSharing(stopSharing(queuePosition(state, position, now), now + 10), now + 20); expect(queuePosition(s, position, now + 30).pending).toBeUndefined(); });
  it.each([
    { ...membership, authorized: false }, { ...membership, identityVerified: false }, { ...membership, reconciled: false }, { ...membership, outingEndsAt: now },
  ])('does not release content before current authorization', m => expect(eligiblePosition(queuePosition(state, position, now), m, now)).toBeUndefined());
  it('expires undelivered positions at ten minutes', () => expect(eligiblePosition(queuePosition(state, position, now), membership, now + 600000)).toBeUndefined());
  it('stops at local expiry even without a connection', () => expect(eligiblePosition(queuePosition(state, position, now), membership, state.expiresAt)).toBeUndefined());
  it('rejects future timestamps beyond clock tolerance', () => expect(queuePosition(state, { ...position, observedAt: now + 60000 }, now).pending).toBeUndefined());
});
describe('retention and pack validity — A02/A18', () => {
  const outing: Outing = { id: 'test', title: 'Walk', createdAt: 0, endsAt: now, reports: [] };
  it('removes all private content by removing the whole outing at the retention boundary', () => { const s = { ...emptyStore(), outings: [{ ...outing, meeting: { latitude: 1, longitude: 1, name: 'Private', version: 1, setAt: 1 } }] }; expect(cleanStore(s, now + RETENTION_MS - 1).outings).toHaveLength(1); expect(cleanStore(s, now + RETENTION_MS).outings).toHaveLength(0); });
  it('removes expired private reports', () => { const s = { ...emptyStore(), outings: [{ ...outing, reports: [{ id: 'r', level: 'busy' as const, observedAt: 1, expiresAt: now }] }] }; expect(cleanStore(s, now).outings[0].reports).toHaveLength(0); });
  it('never marks a route-less pack ready', () => expect(packState({ ...outing, pack: { savedAt: now, routeVersion: 1, meetingVersion: null } })).toBe('missing'));
});

it('discards an already queued position when the sharing window expires', () => {
  const queued = queuePosition(state, position, now);
  const expired = queuePosition(queued, { ...position, observedAt: state.expiresAt }, state.expiresAt);
  expect(expired.mode).toBe('off'); expect(expired.pending).toBeUndefined();
});
