# Architecture

## Current executable slice

A React Native / Expo application shares its domain and UI across Android and iOS. A browser target makes UI inspection possible without a mobile SDK. Framework adoption remains provisional until native background location, encrypted exchange and map-download prototypes pass Milestone A.

The core uses plain TypeScript with no React or native dependencies. Zod validates stored state and source manifests. A bounded SAX parser imports GPX without document types or external entities. MultiLineString geometry preserves track gaps.

MapLibre Native / MapLibre GL JS adapters are compiled but only request a basemap when a maintainer supplies an approved style. Without one, a local geographic diagram displays only supplied route geometry, meeting point and current position. It is labelled as a diagram, not a walking map.

## Private storage

An encrypted index contains preferences, random outing IDs, lifecycle states and erased-ID tombstones. It contains no route, message or coordinates. Each outing has a separate SQLCipher database and 256-bit randomly generated key in platform secure storage.

The key is never put into repository files, telemetry or error messages. Database names derive only from validated UUIDs. Writes are serialized. Deletion intent is durable before key erasure. Deletion does not silently succeed on an error. Missing keys for existing databases fail closed rather than creating a new empty history.

A new vault is staged before being written. On interrupted creation it is removed at recovery rather than left as hidden private data. Completed deletion IDs remain tombstoned so a delayed in-memory write cannot recreate a deleted outing. The index is metadata, which still needs an operational retention review before release.

SQLCipher guards data at rest; it does not provide end-to-end communication. The browser stores nothing in localStorage, IndexedDB, cookies or a service-worker cache. Browser state lives in memory for the current session.

## Positioning and expiry

No background task or sharing sender is enabled. Foreground position updates are opt-in and transient. Changing outings, backgrounding the app or reaching outing expiry removes the watcher and current displayed position. Late callbacks are rejected using a generation token. Queue policy contracts are tested independently but no network transport consumes them yet.

Local expiry is checked before display, on foreground resume and during active execution. Outing removal drives whole-vault key deletion, including its route pack and cached context. A powered-off phone cannot run cleanup; pending work happens at the next permitted execution.

## External context

Weather is fetched only by a deliberate action after disclosure and opt-in. Coordinates are rounded to two decimal places. This reduces precision but is not anonymization. Forecast issue time is omitted when unavailable. Provider time and retrieval time are separate. Gaps and elevation are not included in the simple arrival-time estimate, and the UI says so.

Crowd source records are candidates. They cannot produce live observations. No nearby-device scanning or public GPS aggregation is implemented. A valid zero, an empty result, failure, stale information and no coverage have independent domain states.

## Target components still to implement

The release architecture includes an authenticated ciphertext relay, a public context service, signed source configuration and audited mobile cryptography. Private data must never be mined to fill crowd coverage. Protocol and license decisions precede private group integration. See decision 002.
