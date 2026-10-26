# Implementation status — 26 October 2026

This status describes the development preview. A signed standalone [Android APK is available](downloads.md); this is not the completed Release 1 product. The complete Release 1 plan remains the target. Milestone A is **not complete** because physical Android/iOS, background map downloads and encrypted group exchange have not been demonstrated.

## Working development slice

| Requirement | Evidence and limits |
| --- | --- |
| G01 | Local outings with title, duration and encrypted native persistence. Private group synchronization absent. |
| G05/G07 | Foreground local positioning only; late callbacks, backgrounding, switching and expiry stop the watcher. No sharing or background service. |
| M01/M03 | Route diagram, coordinates, meeting point entry and optional MapLibre provider configuration. Native behavior requires devices. |
| M04/A07 | Bounded GPX parsing, namespace/coordinate validation, entity rejection and gap-preserving segments; automated tests pass. |
| M05/M07 | Local distance from saved geometry, accuracy handling and versioned local meeting points. No turn instructions or remote acknowledgments. |
| M08/A02 | Route/meeting version check and native storage primitive. No downloadable map area or claim of a complete basemap pack. |
| W01/W03/W04 | Optional real forecast adapter, explicit provider opt-in, simple pace estimate, valid/retrieval times and cached state. No weather map layer or multi-point forecast yet. |
| D01/D02/D04/D06 | Candidate registry and honest coverage/metric/freshness domain states. No active crowd feed. |
| D05 | Expiring personal local reports. Private group distribution pending. |
| U01/U02 | Semantic controls and large text defaults, English only, metric/imperial and pace controls. Full accessibility/device audit pending. |
| U03/A18 | Per-outing key deletion, durable deletion intent, retry and anti-resurrection policy tested with an in-memory driver. Native erase verification remains open. |
| C05/A03–A06 | Pure queue policy tests cover reconciliation, identity, expiry, coalescing and stop. No connected transport. |
| C07/A19 | Whole-outing local deletion primitive implemented; dedicated chat storage and authenticated remote deletion still to build. |

## Verification in this environment

- Strict TypeScript check passed.
- 60 domain/lifecycle tests passed, including deletion recovery and an expiry regression.
- Web, Android and iOS JavaScript exports passed.
- Android and iOS native project generation passed with SQLCipher flags, prototype IDs and permission configuration.
- Browser UI inspected: home/practice outing, invalid-coordinate rejection, meeting point change, local pack check and honest missing crowd coverage.

Android release compilation passed on GitHub Actions. An API 35 x86_64 emulator passed standalone launch, native SQLCipher availability, synthetic outing creation, encrypted persistence after restart, local deletion and absence after another restart. The same application payload was signed locally using the owner certificate, verified, checked for 16 KB ZIP/ELF alignment and published as `v0.1.0-preview.1`. The workflow and source commits are recorded in the release metadata.

Physical phones, background/screen-lock tests, forensic secure-store erasure, iOS backup behavior, real offline map download, battery tests and independent security review remain **pending**. The Mac has a task-local JDK and signing tools; Android compilation and emulator execution used GitHub Actions. Full Xcode and the connected-iPhone Personal Team test remain pending the owner's setup. Exports and prebuild do not replace native testing.

## Next work in dependency order

1. Complete native tool setup and the two-phone feasibility protocol, keeping the framework provisional.
2. Select and validate a secure messaging implementation compatible with the approved MIT licensing model. Any dependency imposing additional obligations needs review before integration; MIT adoption is complete.
3. Select an offline-compatible map provider or self-hosted map deployment, with attribution, privacy and cost review.
4. Integrate authenticated E2EE identities, membership, invitations, relay and chat history deletion with per-device deletion acknowledgments.
5. Add background positioning, complete offline packs, walking routing, weather route layers, approved crowd pilot and source-update authentication.
6. Conduct field/battery/accessibility tests and independent security review; resolve public-release gates.

Repository: [fabiogiacomini/Vico](https://github.com/fabiogiacomini/Vico), public, owned by the authenticated **fabiogiacomini** account. The owner selected MIT for original code on 26 October 2026. GitHub private vulnerability reporting is enabled and verified by API. Repository availability is separate from mobile release readiness.

GitHub authentication note: an authenticated user API call succeeded after network access was enabled in the execution environment. The earlier expired-token diagnosis was incorrect; no credential renewal was required. Verify network access and an authenticated API request before treating a future status failure as an expired token.
