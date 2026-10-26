# Third-party notices

This project uses open source dependencies. Their licenses remain independent of Vico's MIT license for original code. `docs/dependency-inventory.json` records installed JavaScript package metadata for review; it is not a complete native binary bill of materials or legal compatibility opinion.

Principal components: React/React Native and Expo (MIT), MapLibre React Native (MIT), MapLibre GL JS (BSD-3-Clause), SQLCipher Community Edition (BSD-style terms), saxes (ISC), Zod (MIT), Lucide icons (ISC) and Vitest (MIT). Verify the installed package notices and bundled native components before distribution.

The Android preview includes `assets/THIRD-PARTY-NOTICES.zip` inside the APK, also provided as a companion release asset. It contains the installed package notices, the template notice and pinned native notices, including MapLibre Native Android and its upstream components, SQLCipher and OpenSSL. Sources and extraction details are in [native notice provenance](docs/licenses/native/README.md). Redistributors must retain the applicable notices; Vico's MIT license does not replace them.

The Expo starter archive declared 0BSD in its package metadata and included an MIT notice for 650 Industries, Inc. The bundled notice is preserved in `docs/licenses/expo-template-MIT.txt`; upstream rights and notices continue to apply to template portions. No libsignal or OpenMLS code is included in this snapshot.

Weather: data served by Open-Meteo is attributed in the interface under CC BY 4.0. The hosted free endpoint has separate non-commercial access terms. See https://open-meteo.com/en/terms .

Map data: no external basemap is configured. The operator must supply all attribution and satisfy distribution/offline rights for the selected provider. OSM-derived maps require the relevant OpenStreetMap attribution and license compliance.

Crowd candidates: registry records quote catalog declarations pending validation. No crowd observations are bundled. The practice GPX is synthetic project test data.
