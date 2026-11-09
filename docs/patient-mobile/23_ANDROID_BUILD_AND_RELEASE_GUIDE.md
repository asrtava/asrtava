# Android & iOS Native Build and Play Store / App Store Release Guide

## 1. Android Release Configuration
Located in [`apps/patient-mobile/android`](file:///c:/Users/madha/Desktop/Medical_Project/apps/patient-mobile/android):
- **Package Name**: `com.asrtava.patient`
- **Gradle Version**: 8.x with Kotlin 1.9+
- **Minimum SDK**: 24 (Android 7.0 Nougat) | **Target SDK**: 34 (Android 14)
- **Local Development**:
  ```bash
  cd apps/patient-mobile
  npm run android
  ```
- **Release Keystore Generation**:
  ```bash
  keytool -genkeypair -v -storetype PKCS12 -keystore asrtava-release-key.keystore -alias asrtava-key-alias -keyalg RSA -keysize 2048 -validity 10000
  ```
- **Google Play Store App Bundle (AAB)**:
  ```bash
  cd android && ./gradlew bundleRelease
  ```
  Output generated at `android/app/build/outputs/bundle/release/app-release.aab`.

---

## 2. iOS Release Configuration
Located in [`apps/patient-mobile/ios`](file:///c:/Users/madha/Desktop/Medical_Project/apps/patient-mobile/ios):
- **Bundle Identifier**: `com.asrtava.patient`
- **Minimum iOS Version**: iOS 14.0+
- **Pod Installation**:
  ```bash
  cd ios && pod install
  ```
- **Local Development**:
  ```bash
  npm run ios
  ```
- **Apple App Store Archive**:
  1. Open `ios/Asrtava.xcworkspace` in Xcode.
  2. Select target device **Any iOS Device (arm64)**.
  3. Menu &rarr; Product &rarr; **Archive**.
  4. Validate using Apple Developer Team Distribution Certificate.
  5. Upload to TestFlight / App Store Connect.

