# Vico

**Stay together. Go a little further.**

Vico is a free Android and iOS project for private group outings, saved routes and useful information about the places ahead. It is being built with open source tools. The interface and repository documentation are in English.

**Status: local development prototype, not a public mobile release.** Vico's original code is licensed under the [MIT License](LICENSE), selected by the owner on 26 October 2026. Third-party components retain their own licenses. See [the licensing and messaging decision](docs/decisions/002-license-and-messaging.md).

## What works in this prototype

- Create a local outing with an end time.
- Import bounded GPX tracks or routes. Track segment gaps remain gaps.
- Inspect the saved trace, choose a meeting point and change its version.
- Request your phone's foreground position, with observation time and accuracy. It stops on backgrounding, outing change or expiry.
- Check a local route pack against the current route and meeting point versions.
- Request an Open-Meteo forecast after explicit opt-in. Area, valid time, retrieval time and attribution stay visible. Walking pace changes the requested arrival-time forecast.
- Inspect a source registry with inactive crowd candidates and honest missing-data states.
- Record expiring local crowd observations, explicitly separate from measured data.
- Use metric or imperial units.
- Delete an outing's local content and dedicated native storage key. Interrupted deletion is resumed; deleted IDs cannot be reintroduced by an old write.

The default view shows a **route diagram without a basemap**. Configure an approved map provider to activate MapLibre. A renderer does not supply offline map rights. No map tiles are downloaded by this prototype.

Native storage uses SQLCipher and platform secure storage, with an independent encrypted database and key for each outing. Browser preview is deliberately memory-only: reload clears the session. These integrations still require physical-device verification. This is not a security certification.

## What is still being built

Private group admission, chat, live sharing, Signal/MLS integration, relay hosting, background positioning, downloadable basemaps, online walking routing, personal recordings, authenticated source updates, active crowd adapters and field validation are not connected. The app says this explicitly; it does not simulate a working group or display invented crowds.

The public release still requires the original implementation plan, native integration results, dependency-license compatibility and protocol decisions, a source pilot and an independent security review. [Implementation status](docs/implementation-status.md) maps the code to the plan.

## Run locally

Use Node.js 24 LTS and pnpm 11.25.0. Install pnpm through your usual package manager. Run commands from the repository root.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm registry:check
pnpm web
```

The browser is a development aid, not the mobile release or a production web service. Use the practice outing only to inspect the UI: its route is synthetic and is not a verified walking path.

For a static preview:

```sh
pnpm export:web
python3 -m http.server 8765 --bind 127.0.0.1 --directory dist
```

## Android and iOS development builds

MapLibre and SQLCipher need a native development build. **Expo Go is not supported** and Vico refuses a native storage build without SQLCipher.

Install the Android SDK and a JDK supported by the generated Gradle configuration. iOS requires a Mac with full Xcode and CocoaPods. Do not use only the Xcode Command Line Tools.

```sh
pnpm prebuild
pnpm android
# On a Mac with Xcode and CocoaPods:
pnpm ios
```

`expo run:android` / `expo run:ios` install native dependencies when required. Generated `android/` and `ios/` directories are ignored; app configuration and native changes belong in reviewed Expo config plugins. Prototype identifiers are `org.vico.prototype`; choose final owned identifiers before distribution.

A JavaScript bundle export checks module resolution for both platforms but does **not** compile or exercise a native binary:

```sh
pnpm export:mobile
```

See [native test protocol](docs/native-test-protocol.md) for the required two-phone tests. Building through a paid cloud service is optional; local native builds are supported by the project structure.

## Optional basemap configuration

Copy `.env.example` to `.env`, select a provider and add its required attribution. Public `EXPO_PUBLIC_*` settings are bundled into the app: **never put secrets there**. Review the provider's privacy, distribution, caching and offline rights first. The standard OpenStreetMap raster server must not be used for bulk offline downloads.

No basemap URL is enabled by default. Offline rights are not inferred from a publicly accessible endpoint. The offline-rights flag reserves a future integration; it does not enable downloads in this build.

## Privacy and deletion

Vico sends no outing content to a relay in this prototype. Weather requests are direct and optional; Open-Meteo receives the selected area rounded to two decimals and the client's network address. A configured map provider can see map requests. No analytics or crash-reporting service is included.

Deletion removes Vico-managed local content and its native storage key. This aims to make remaining encrypted files unusable to Vico; flash remanence, OS snapshots, compromised devices and copies outside the app cannot be guaranteed away. A future remote deletion request must show pending and confirmed devices separately. Never claim that sending the request means every copy is already gone. [Deletion design](docs/deletion.md).

## Repository guide

- `App.tsx`: accessible foreground application workflows.
- `src/core/`: validated models, GPX, geometry, retention, source semantics, queue policy and vault lifecycle.
- `src/platform/`: native encrypted storage, memory-only web storage and file import.
- `src/components/`: reusable UI, route diagram and platform MapLibre adapters.
- `src/data/` and `registry/`: weather adapter, practice data and source records.
- `tests/`: meaningful domain and lifecycle tests.
- `docs/`: plan, architecture, decisions, privacy and validation evidence.

See [contributing](CONTRIBUTING.md), [security](SECURITY.md) and [third-party notices](THIRD_PARTY_NOTICES.md). Project repository: [fabiogiacomini/Vico](https://github.com/fabiogiacomini/Vico). It contains development source code; native field validation and mobile store submissions remain pending.
