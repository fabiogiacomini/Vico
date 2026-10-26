import type { Position } from './model';
// A policy contract for a future encrypted transport. There is no network sender here.
export interface SharingState { mode: 'off' | 'active' | 'paused'; expiresAt: number; eligibleAfter: number; pending?: Position }
export interface ReconciledMembership { authorized: boolean; identityVerified: boolean; reconciled: boolean; outingEndsAt: number }
export const stopSharing = (s: SharingState, now: number, mode: 'off' | 'paused' = 'off'): SharingState => ({ ...s, mode, eligibleAfter: now, pending: undefined });
export const resumeSharing = (s: SharingState, now: number): SharingState => ({ ...s, mode: 'active', eligibleAfter: now, pending: undefined });
export function queuePosition(s: SharingState, p: Position, now: number): SharingState {
  if (now >= s.expiresAt) return stopSharing(s, now);
  if (s.mode !== 'active') return { ...s, pending: undefined };
  if (p.observedAt <= s.eligibleAfter || p.observedAt > now + 30000 || now - p.observedAt >= 600000) return s;
  return !s.pending || p.observedAt > s.pending.observedAt ? { ...s, pending: p } : s;
}
export function eligiblePosition(s: SharingState, membership: ReconciledMembership, now: number): Position | undefined {
  if (!membership.reconciled || !membership.authorized || !membership.identityVerified || s.mode !== 'active' || now >= s.expiresAt || now >= membership.outingEndsAt || !s.pending || now - s.pending.observedAt >= 600000 || s.pending.observedAt > now + 30000) return undefined;
  return s.pending;
}
