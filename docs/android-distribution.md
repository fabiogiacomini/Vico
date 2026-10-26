# Android preview distribution

Android preview releases are standalone APKs. They contain the application bundle and do not require Expo Go, a development server or a paid build service. Early previews remain local-outing prototypes: connected group chat, live sharing and complete basemap downloads are not available yet.

## Build and release workflow

1. Run the `Build and verify Android preview` GitHub Actions workflow on the reviewed source commit. It generates the Android project, checks SQLCipher configuration and assembles a non-debuggable unsigned release for ARM64 and x86_64.
2. CI signs a copy using a disposable test certificate, launches an API 35 x86_64 emulator and exercises startup, synthetic outing creation, persistence across restart, deletion and no resurrection after another restart. The temporary signer and test APK are removed after the test.
3. Download the unsigned APK and smoke evidence from the successful run. Record the source commit and unsigned input checksum.
4. Sign locally with the owner's dedicated release certificate. Private signing credentials remain outside source control and are not uploaded to GitHub. The helper verifies the final certificate and confirms signing did not change the application payload.
5. Publish only the owner-signed APK, public certificate information and SHA-256 checksum in a GitHub prerelease, with feature limitations and validation evidence. Link to that release from the repository download page.

If a run is interrupted by an unrelated emulator system failure after successful compilation, the `Verify existing Android preview artifact` workflow can retest the exact artifact. It checks the same-repository origin, source SHA and unsigned checksum before signing a disposable copy. Retesting does not replace native compilation or permit changing the payload.

The initial preview supports Android 8/API 26 or later on ARM64 phones; x86_64 is included for compatible devices and emulator verification. It does not include 32-bit ARM or x86 builds. Physical-device, battery and background tests remain separate release gates.

## Local signing

Install a JDK and the Android SDK build tools through their official sources. Set these variables to private local paths, then run the helper from the repository root:

```sh
export VICO_APKSIGNER=/private/path/to/android-build-tools/apksigner
export VICO_KEYSTORE=/private/path/to/vico-release.p12
export VICO_KEYSTORE_PASSWORD_FILE=/private/path/to/password
./scripts/sign-android-preview.sh Vico-unsigned.apk Vico-android.apk
```

The variables contain paths, not password values. The script passes passwords through a local file and never prints them. `.github/android-signing-certificate.json` contains only the public certificate identity. Verify the APK fingerprint against that file.

Keep encrypted backups of the signing key and password under the owner's control. Reusing the same signing identity is necessary for ordinary direct-install updates. Do not regenerate it for each release or place it in release assets, a public issue, the source ZIP or GitHub Actions artifacts.

For each new distributed build, increment `android.versionCode` in `app.json`, update the visible version and publish a new immutable preview tag. Record the actual build commit rather than assuming the current documentation commit produced an older APK. Verify 16 KB native-library ZIP alignment with the SDK's `zipalign -c -P 16 4` before publishing.

## Install a published preview

Download the APK from the project's GitHub Releases page on the Android phone and open it. Android may ask for permission to install from the chosen browser or file manager; grant it only for the trusted download source. Do not disable Play Protect or device-wide security checks. Device policy, operating system, region and manufacturer can affect installation.

Only publish a download link after the signed artifact is present and its hash and signature have been verified. An unsigned CI artifact is build input for the owner, not a public installation package.
