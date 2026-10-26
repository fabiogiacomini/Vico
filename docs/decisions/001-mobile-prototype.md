# 001 — Shared mobile prototype

Status: provisional engineering choice, pending physical-device evidence.

Use React Native 0.88, Expo SDK 58 and TypeScript. Use native development builds with MapLibre and SQLCipher. This supports shared UI and pure domain tests while retaining reviewed native integrations. Expo's cloud build service is optional. React Native, Expo and MapLibre are open source; operating systems and store distribution still impose platform requirements.

This environment currently has no full Xcode, usable JDK or Android SDK. Both native project generation and platform JavaScript exports can be checked here. Full native compilation, permissions, screen-locked positioning, device key deletion and battery behavior require the native tools and physical phones. The framework is not declared proven from a browser preview.

Prototype configuration targets iOS 16.4+ and Android API 26+. These are provisional floors, not tested-device promises. Record actual device support after Milestone A. Final bundle identifiers and notification ownership also remain open.

Sources: [Expo project setup](https://docs.expo.dev/get-started/create-a-project/), [MapLibre Expo setup](https://maplibre.org/maplibre-react-native/docs/setup/expo/), [Expo SQLCipher](https://docs.expo.dev/versions/latest/sdk/sqlite/), [Expo location](https://docs.expo.dev/versions/latest/sdk/location/).
