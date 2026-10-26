# Native notices distributed with the Android preview

- `maplibre-native-android-13.6.1.txt`: unmodified Android notice file from [MapLibre Native android-v13.6.1](https://github.com/maplibre/maplibre-native/blob/android-v13.6.1/platform/android/LICENSE.md), including upstream component notices. The Android dependency version is selected by MapLibre React Native 11.5.0.
- `openssl-3.3.2.txt`: unmodified [OpenSSL 3.3.2 license](https://github.com/openssl/openssl/blob/openssl-3.3.2/LICENSE.txt). Expo SQLite selects the `io.github.ronickg:openssl:3.3.2-1` Android artifact when SQLCipher is enabled.
- `sqlcipher-vendored.txt`: the SQLCipher copyright and license block extracted verbatim from the `expo-sqlite` installed `vendor/sqlcipher/sqlite3.c` amalgamation. SQLite itself is public domain.

`scripts/collect-notices.py` packages these files, Vico's MIT license, the template notice and the installed JavaScript package license/notice files in the companion release archive. Build-time package notices are included too; their presence does not mean their executable code is bundled in the APK. The JavaScript inventory is not a complete native SBOM. Update these pinned upstream notices when dependencies change.
