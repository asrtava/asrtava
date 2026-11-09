import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Header, Card, Badge, Button } from '../../components';
import { PatientProfile, HospitalSummary, FamilyMember } from '../../types';

interface ProfileScreenProps {
  patient: PatientProfile;
  linkedHospitals: HospitalSummary[];
  onBack: () => void;
  onLogout: (allDevices?: boolean) => void;
  onSwitchHospital: (hosp: HospitalSummary) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  patient,
  linkedHospitals,
  onBack,
  onLogout,
  onSwitchHospital,
}) => {
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  const familyMembers: FamilyMember[] = [
    { id: 'fam-1', name: 'Sunita Verma', relationship: 'Spouse', uhid: 'APEX-2026-00085', age: 31, gender: 'F' },
    { id: 'fam-2', name: 'Aarav Verma', relationship: 'Child', uhid: 'APEX-2026-00096', age: 6, gender: 'M' },
  ];

  const handleLinkHospital = () => {
    Alert.alert(
      'Link New Hospital Network',
      'Enter hospital organization code (e.g. METRO-DEL) to connect your health records across participating healthcare institutions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Verify & Link', onPress: () => Alert.alert('Verification SMS Sent', 'Enter OTP sent to your registered mobile number.') },
      ]
    );
  };

  const handleConsentHistory = () => {
    Alert.alert(
      'DPDP / Consent Ledger',
      'Electronic consent record #CON-88192 active for Apex Care Multi-Specialty Hospital. Granted under Digital Personal Data Protection Act (DPDP 2023).'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Account & Privacy" subtitle="Demographics, linked facilities & consent" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{patient.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{patient.name}</Text>
              <Text style={styles.uhidText}>UHID: {patient.uhid}</Text>
              <Text style={styles.contactText}>📞 {patient.phone} · ✉️ {patient.email}</Text>
            </View>
          </View>

          <View style={styles.medicalTagsRow}>
            <View style={styles.tagPill}>
              <Text style={styles.tagLabel}>Blood Group</Text>
              <Text style={styles.tagValue}>{patient.bloodGroup}</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagLabel}>Age / Sex</Text>
              <Text style={styles.tagValue}>{patient.age}y / {patient.gender}</Text>
            </View>
            <View style={styles.tagPill}>
              <Text style={styles.tagLabel}>Allergies</Text>
              <Text style={[styles.tagValue, { color: colors.danger }]}>
                {patient.allergies[0] || 'None Known'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Linked Hospital Networks */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Linked Hospital Organizations ({linkedHospitals.length})</Text>
          <TouchableOpacity onPress={handleLinkHospital}>
            <Text style={styles.addLinkText}>+ Add Hospital</Text>
          </TouchableOpacity>
        </View>

        {linkedHospitals.map((hosp) => (
          <Card key={hosp.id} style={styles.hospitalCard}>
            <View style={styles.hospRow}>
              <View>
                <Text style={styles.hospName}>{hosp.name}</Text>
                <Text style={styles.hospCity}>Facility Code: {hosp.code} · {hosp.city}</Text>
              </View>
              <Button
                title="Select"
                onPress={() => onSwitchHospital(hosp)}
                variant="outline"
                size="sm"
              />
            </View>
          </Card>
        ))}

        {/* Family Member & Dependent Profiles */}
        <Text style={styles.sectionTitle}>Family & Dependents</Text>
        <Card style={styles.familyCard}>
          {familyMembers.map((fam, idx) => (
            <View key={fam.id}>
              <View style={styles.famItem}>
                <View>
                  <Text style={styles.famName}>{fam.name}</Text>
                  <Text style={styles.famMeta}>{fam.relationship} · {fam.age}y ({fam.gender}) · {fam.uhid}</Text>
                </View>
                <Badge label="Authorized" variant="success" />
              </View>
              {idx < familyMembers.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        {/* Communication Preferences & Consent */}
        <Text style={styles.sectionTitle}>Privacy & Notifications</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>Biometric FaceID / Fingerprint</Text>
              <Text style={styles.settingDesc}>Quick unlock on app launch</Text>
            </View>
            <Switch value={biometricsEnabled} onValueChange={setBiometricsEnabled} trackColor={{ false: colors.border, true: colors.primary }} />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>WhatsApp Consultation Alerts</Text>
              <Text style={styles.settingDesc}>Appointment passes and ready lab alerts</Text>
            </View>
            <Switch value={whatsappAlerts} onValueChange={setWhatsappAlerts} trackColor={{ false: colors.border, true: colors.primary }} />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity onPress={handleConsentHistory} style={styles.consentRow}>
            <Text style={styles.consentTitle}>DPDP 2023 Consent History & Rights</Text>
            <Text style={styles.consentArrow}>→</Text>
          </TouchableOpacity>
        </Card>

        {/* Logout Actions */}
        <View style={styles.logoutContainer}>
          <Button
            title="Log Out Current Device"
            onPress={() => onLogout(false)}
            variant="outline"
            style={styles.logoutBtn}
          />
          <Button
            title="Log Out All Devices (Revoke Sessions)"
            onPress={() => onLogout(true)}
            variant="danger"
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 60 },
  profileCard: { marginBottom: spacing.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatarLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarLargeText: { fontSize: 24, fontWeight: typography.weights.bold, color: colors.textInverted },
  profileDetails: { flex: 1 },
  profileName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  uhidText: { fontSize: 11, fontFamily: 'monospace', fontWeight: typography.weights.bold, color: colors.primary, marginTop: 1 },
  contactText: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  medicalTagsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surfaceSubtle, padding: spacing.sm, borderRadius: 8 },
  tagPill: { alignItems: 'center' },
  tagLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' },
  tagValue: { fontSize: 11, fontWeight: typography.weights.bold, color: colors.textPrimary, marginTop: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.xs },
  addLinkText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primary },
  hospitalCard: { marginBottom: spacing.sm, padding: spacing.md },
  hospRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hospName: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textPrimary },
  hospCity: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  familyCard: { padding: spacing.md, marginBottom: spacing.lg },
  famItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  famName: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textPrimary },
  famMeta: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  settingsCard: { padding: spacing.md, marginBottom: spacing.lg },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  settingTitle: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.textPrimary },
  settingDesc: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  consentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  consentTitle: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primary },
  consentArrow: { fontSize: 16, color: colors.primary, fontWeight: typography.weights.bold },
  logoutContainer: { marginTop: spacing.sm },
  logoutBtn: { marginBottom: spacing.sm },
});

