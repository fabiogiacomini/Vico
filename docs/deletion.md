# Permanent deletion within Vico

Approved product requirement, 26 October 2026. The owner agrees that copies outside the app cannot be removed by Vico.

## Meaning and scopes

“Delete chat permanently” must remove chat history and all app-managed local copies, not merely hide a thread from a list. It must erase a dedicated local history key, remove queued content, attachments, previews, indexes and offline-private copies, and clear in-memory references. The chat history key must be separate from the protocol's current ratchet or membership keys; deleting stored history must not accidentally damage active identity or other conversations.

The app must distinguish:

1. Delete on this device: complete after local key erasure and managed-content cleanup succeed.
2. Request deletion on other authorized devices: an authenticated encrypted request with a fixed cutoff, membership context, idempotency ID and explicit per-device pending/confirmed status. Offline peers remain pending. Never present relay acceptance as completed remote deletion.

The scope of a local chat purge is separate from leaving a group, deleting the entire outing or ending an outing. The organizer cannot silently delete other participants' independently exported files.

## Current implementation

There is no connected chat in 0.1. The corresponding local primitive exists for **whole outings**: an independent SQLCipher database and secure-store key per outing. Removing an outing also removes its route, point, notes and context because those objects share that outing vault. The UI requires a deliberate DELETE confirmation.

The encrypted index first records a pending deletion and a durable erased-ID tombstone. Key removal precedes database-file removal. Deletion is retried after interruption. A stale write cannot reactivate an erased ID. The interface reports success only after the storage operation finishes.

The index stores random identifiers and deletion state, not the deleted content. Tests use a deterministic in-memory driver to exercise interrupted deletion and resurrection prevention; native keychain and file behavior are still unverified on physical devices.

## Release requirements

- Give chat history its own key and vault; implement queue purge and authenticated deletion events.
- Reject replay of deleted content at the client and relay. Define a cutoff so receiving a new legitimate message does not revive deleted history.
- Process deletion intent before rendering a reopened chat or releasing queued content.
- Delete encrypted relay envelopes, attachments and object-storage copies within the documented policy. No private-content backups in Release 1.
- Verify native database sidecars, import caches, previews, application snapshots and backup rules. Android backup is disabled; iOS backup exclusion and app-switcher privacy remain release work.
- Inspect physical Android and iOS devices after deletion, restart, interrupted deletion, storage failure, offline recovery and attempted restore.
- State that screenshots, exports, OS or user backups outside Vico, compromised clients and previously copied keys are outside the deletion guarantee.

Cryptographic key erasure makes ciphertext inaccessible when all usable key copies under Vico's control are removed. It is not a claim of physical flash overwrite or immunity to forensic recovery on a compromised device. Do not promise provable immediate deletion from every offline or malicious participant.
