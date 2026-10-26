# Native feasibility and field protocol

Milestone A is open until these tests have physical-device evidence. Use synthetic content and a clearly identified test group.

1. Build and install custom Android and iOS development clients. Record phone, OS, build, battery and permission mode.
2. Confirm SQLCipher is enabled; a build without it must fail closed. Inspect that a raw copied database has no plaintext route or message content.
3. Create two outings. Delete one and verify only its secure-store key, database and managed copies are removed. Restart and verify it stays absent. Interrupt deletion between durable intent, key removal and file removal; it must complete on restart.
4. Simulate missing keys, write failure, storage pressure and a stale write after deletion. Do not substitute a new database or display a false success.
5. Import valid, gapped, malformed, oversized and date-line GPX files. Compare geometry with trusted software. Never bridge gaps or label a straight line as a walking route.
6. Test own foreground position with denied, approximate and revoked permissions. Background the app and verify the current prototype stops positioning. Outing expiry must stop it too. The later background prototype must be tested screen-locked on both platforms.
7. With an approved provider, test map display. A future downloadable basemap must pass completeness and airplane-mode restart checks before being labelled ready. Current route-pack validation does not validate any map tiles.
8. Verify native saved routes and points reopen after restart without a network. Browser reload is expected to clear its session.
9. Test weather time, unavailable values, outage preservation and opt-in. Inspect actual network requests to verify no private outing data is sent to context providers.
10. Do not activate a crowd source without recent-record, footprint, license and freshness evidence. Test missing coverage as well as measured zero.
11. After secure group integration, test mixed-platform admission, identity change, removal, reconnection and key changes. Observe that paused/stopped/expired positions cannot escape a queue.
12. Test local chat deletion, remote requests, offline pending states, acknowledgments and replay prevention. Copies outside Vico are outside scope.
13. Run screen-reader and large-text workflows. Record contrast, touch targets, focus order, rotation and small-screen layout.
14. Run an eight-hour locked-screen outing after background integration. Set the battery budget from actual device measurements, not a simulator estimate.

Independent security review and resolved critical findings are mandatory before a production release. An explicitly labelled local-outing development preview does not complete this gate. A successful JavaScript export, native prebuild or unit suite is not evidence that these scenarios have passed.
