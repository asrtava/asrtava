# Offline Handling, Accessibility & Release Guides

## 1. Offline Resilience & Network Handling
- Detects network transitions via NetInfo.
- Previously authorized reference cards (e.g. Appointment Pass and active prescriptions) remain readable from local memory cache when offline.
- Destructive or transactional actions (booking slots, submitting payments) require active network connection and revalidate slot availability on the backend to prevent duplicate bookings.

## 2. Accessibility & Typography
- Minimum touch targets of 44x44 dp for all buttons and form controls.
- High-contrast text palettes conforming to WCAG AA standards.
- Dynamic font scaling support for seniors and visually impaired patients.

## 3. Native Android & iOS Build Configurations
- **Android**: Configured in [`apps/patient-mobile/android`](file:///c:/Users/madha/Desktop/Medical_Project/apps/patient-mobile/android) with Gradle, Kotlin, Proguard rules, and release keystore signing.
  - Development build: `npm run android`
  - Production release AAB: `cd android && ./gradlew bundleRelease`
- **iOS**: Configured in [`apps/patient-mobile/ios`](file:///c:/Users/madha/Desktop/Medical_Project/apps/patient-mobile/ios) with CocoaPods and Xcode Scheme.
  - Development build: `npm run ios`
  - Production Archive: Xcode Product &rarr; Archive with Apple Developer Distribution Certificate.

## 4. Automated Testing & Verification
```
> Asrtava@0.1.0 test
> npx ts-node --project ../../backend/tsconfig.json tests/patient_mobile.test.ts

▶ ASRTAVA Patient Mobile App Architecture & Workflow Tests
  ✔ validates 10-digit Indian mobile number format
  ✔ generates high-entropy mobile device session tokens with refresh rotation
  ✔ sets correct x-hospital-id header upon hospital switching without cross-tenant bleed
  ✔ creates non-sensitive, high-entropy check-in QR reference without exposing PII
  ✔ accurately identifies out-of-range abnormal indicators for patient alerting
  ✔ computes invoice outstanding balances accurately
  ✔ sanitizes incoming asrtava:// URL schemes to valid app screens
✔ 7/7 tests passed (100% pass rate)
```

