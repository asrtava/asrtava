# Mobile Security & Data Protection Standards

## 1. Zero Trust Mobile Security Boundary
1. **Keystore & Keychain Backing**:
   - Access tokens are kept in memory and persisted into Android Keystore / iOS Keychain via secure native wrappers.
   - Plain-text authentication tokens are strictly forbidden in `AsyncStorage`.
2. **Network Transport**:
   - TLS 1.3 enforced for all API traffic.
   - Certificate pinning configuration points for production APK/IPA packaging.
3. **Sensitive Clinical Data Shielding**:
   - Push notifications omit full medical diagnoses on the device lock screen, using non-revealing notification previews (e.g. *Diagnostic Results Ready - Tap to view securely in ASRTAVA*).
   - Temporary PDF exports are stored in app-scoped cache and purged upon user logout.
4. **No Hardcoded Secrets**:
   - No payment API secret keys, database credentials, or admin tokens exist in the mobile JavaScript bundle.

