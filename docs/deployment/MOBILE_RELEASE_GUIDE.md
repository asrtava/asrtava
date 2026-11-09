# ASRTAVA Mobile Release Guide: Google Play Store & Apple App Store

This guide details the release engineering pipeline, code signing, automated artifact packaging, store asset criteria, and staged rollouts for the **ASRTAVA Patient Mobile Application** (Android & iOS).

---

## 1. Release Architecture & Versioning Strategy

ASRTAVA Mobile adheres to **Semantic Versioning (SemVer)** with strict build tracking:
- **`versionName` / `CFBundleShortVersionString`**: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)
- **`versionCode` / `CFBundleVersion`**: Monotonically incrementing integer tied to CI build counter (e.g., `10042`)

```
apps/patient-mobile/
├── android/
│   ├── app/build.gradle              # versionCode, versionName, signingConfigs
│   └── app/proguard-rules.pro        # ProGuard obfuscation & R8 optimization
├── ios/
│   └── Podfile                       # CocoaPods dependencies & iOS deployment target (14.0+)
└── src/
    └── config/env.ts                 # Runtime environment switching (production/staging)
```

---

## 2. Google Play Store (Android Release Pipeline)

### 2.1 Android App Bundle (AAB) Generation
ASRTAVA mandates the Google Play Android App Bundle (`.aab`) format to enable dynamic feature delivery and device-optimized APK generation (reducing download footprints by up to 35%).

```bash
# Clean previous builds
cd apps/patient-mobile/android
./gradlew clean

# Build optimized Release AAB with ProGuard / R8 enabled
./gradlew bundleRelease
```
Target output: `android/app/build/outputs/bundle/release/app-release.aab`

### 2.2 Google Play App Signing & Keystore Management
- **Key Generation**: Upload keystores are generated with RSA 4096-bit encryption.
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore asrtava-upload-key.keystore \
  -alias asrtava-upload -keyalg RSA -keysize 4096 -validity 10000
```
- **Play App Signing**: Google manages the final app signing key; upload key is rotated if compromised.
- Keystore passwords and base64 certificates are injected exclusively via CI/CD secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`).

### 2.3 Play Console Staged Rollout Workflow
1. **Internal Testing**: Released to internal QA and clinical testing team (0% public exposure).
2. **Closed Testing (Alpha/Beta)**: Doctor & patient sample cohort across 3 pilot partner hospitals.
3. **Production Staged Rollout**:
   - Day 1: 5% of active user base
   - Day 2: 10% (monitor Crashlytics crash-free rate > 99.8%)
   - Day 4: 25%
   - Day 6: 50%
   - Day 7: 100% full release

---

## 3. Apple App Store (iOS Release Pipeline)

### 3.1 Certificates, Identifiers & Provisioning
- **App ID**: `org.asrtava.patient` with Push Notifications and Associated Domains (Universal Links) entitlements enabled.
- **Distribution Certificate**: Apple Worldwide Developer Relations (WWDR) G3 distribution certificate stored in Apple Developer Portal.
- **Provisioning Profile**: App Store Distribution profile managed via Fastlane Match with encrypted Git repository backend.

### 3.2 Archive & Export Pipeline
```bash
cd apps/patient-mobile/ios
bundle exec fastlane beta   # TestFlight submission
bundle exec fastlane release # App Store Connect release
```

Target output: `ios/build/ASRTAVA.ipa` uploaded to App Store Connect via Transporter CLI / `altool`.

### 3.3 TestFlight Distribution & Beta Feedback
1. **Internal Groups**: Automated deployment to Core Engineering & Clinical QA upon merge to `release/mobile-*`.
2. **External Groups**: Up to 10,000 external beta testers with mandatory release notes detailing clinical module updates and DPDP consent flows.

---

## 4. Healthcare Privacy, Permissions & Compliance

### 4.1 Required Store Declarations
- **Google Play Data Safety**:
  - Personal Data: Collected (Name, Email, Phone, Health records, Prescription PDFs). Encrypted in transit (TLS 1.3) and at rest (AES-256).
  - Data Deletion Request URL: `https://asrtava.com/privacy/data-deletion`
- **Apple App Store Privacy Nutrition Labels**:
  - Health & Fitness: Medical data collected and linked to patient identity.
  - Contact Info: Phone, Email for OTP authentication and telemedicine notifications.
  - Location: Coarse location for nearby hospital / ambulance dispatch (only when authorized).

### 4.2 Runtime Permission Audit
| Platform | Permission | Rationale & Consent Trigger |
| :--- | :--- | :--- |
| Android / iOS | `CAMERA` | Prescription scanning, profile avatar capture, video consultation |
| Android / iOS | `RECORD_AUDIO` | Telemedicine audio / video consult |
| Android / iOS | `POST_NOTIFICATIONS` | Appointment reminders, lab report ready alerts, medication reminders |
| Android | `READ_MEDIA_IMAGES` | Uploading past medical records, DICOM/PDF reports |
| iOS | `NSPhotoLibraryUsageDescription` | Uploading historical lab reports & medical files |

