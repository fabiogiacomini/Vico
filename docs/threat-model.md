# Threat model — initial draft

Assets: private message/history keys, device identity, membership state, route and meeting point, current and historical positions, local reports and the area requested from a context provider.

- A network observer: transport encryption is needed; E2EE is additionally required for private group content. No group transport is enabled yet.
- A compromised relay: must not hold plaintext or content keys. It may still observe delivery metadata; minimize retention and document limits.
- A malicious or removed participant: authenticated membership changes and new keys must exclude future access. Received screenshots and exports cannot be retracted.
- A stolen or compromised phone: platform secure storage and encrypted local databases reduce at-rest exposure. They do not guarantee protection while an attacker controls an unlocked process.
- Interrupted deletion: durable intent, key erasure, retry and anti-resurrection tombstones must prevent hidden data from reappearing. A separate chat history key is required before messaging ships.
- A dishonest context source: keep source, metric, time, footprint and quality visible. Do not turn missing records into a quiet-area recommendation.
- A third-party provider: maps, weather and routing requests disclose an area and network metadata. Request deliberately, cache appropriately and disclose the relationship. A proxy alone is not anonymity.
- Import abuse: bound XML bytes, nesting, points and segments; reject DTD/entities and invalid coordinates. Preserve gaps.
- OS backups, snapshots and termination: verify native backup exclusions and app-switcher privacy before release. Cleanup cannot run while powered off.

Not covered by an absolute promise: user exports, screenshots, offline/malicious peers, external backups, stolen plaintext and physical flash guarantees. The product owner has agreed that deletion scope ends at Vico-managed copies.
