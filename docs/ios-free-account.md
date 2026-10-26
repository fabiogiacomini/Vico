# Test Vico on an iPhone with a free Apple account

Decision: start with a personal-device test on the owner's current Mac. A paid Apple Developer Program membership and TestFlight are not required for this first local test.

The owner will install full Xcode and connect the iPhone. The current environment previously had only Xcode Command Line Tools. Native installation remains pending until Xcode, device trust and personal signing are available.

## Steps requiring the owner

1. Install Xcode from the Mac App Store. Open it and complete its first-run setup and required iOS component installation. Apple account authentication and agreement acceptance are performed by the owner.
2. In Xcode Settings > Accounts, add the Apple account and select the free Personal Team for the project. Do not send account passwords or verification codes in chat.
3. Connect the iPhone by USB. Unlock it and approve the trust prompt on the phone when shown. Enable Developer Mode when iOS requests it.
4. Once Xcode and CocoaPods are available, prepare and run the native project as described below.
5. If automatic signing needs attention, open `ios/Vico.xcworkspace`, select the Vico app target and enable automatic signing with the Personal Team. Select the connected iPhone as the destination and run the app. Resolve any bundle identifier conflict in reviewed app configuration before rebuilding.

## Project commands

From the repository root, with Node.js 24, pnpm and CocoaPods installed:

```sh
pnpm install --frozen-lockfile
pnpm exec expo prebuild --platform ios
pnpm exec expo run:ios --device --configuration Release
```

The release configuration embeds the app bundle and does not require a running development server for normal startup. MapLibre and SQLCipher require a custom native build; Expo Go is not supported. Keep the SQLCipher config plugin enabled. An unsigned simulator build is not an installable physical-iPhone package.

## Free-account limits and test scope

Apple's Personal Team provisioning expires after seven days, so the app must be rebuilt and reinstalled periodically. Apple currently documents up to ten temporary App IDs, three devices and three apps per device for this workflow. This is for personal development testing, not a general public download channel.

First verify launch, encrypted storage availability, a synthetic outing, a force-close/reopen, GPX import, location permission and permanent local deletion. Do not present these results as completed before exercising the connected iPhone. Public iOS distribution and any paid program decision come later.

Sources: [Apple developer account and Personal Team limits](https://developer.apple.com/help/account/basics/about-your-developer-account), [Expo local native development](https://docs.expo.dev/guides/local-app-development/), [iOS Developer Mode](https://docs.expo.dev/guides/ios-developer-mode/).
