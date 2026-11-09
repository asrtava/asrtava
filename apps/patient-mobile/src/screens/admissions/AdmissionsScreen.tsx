import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Header, Card, Badge, Button } from '../../components';
import { AdmissionInfo } from '../../types';

interface AdmissionsScreenProps {
  onBack: () => void;
}

export const AdmissionsScreen: React.FC<AdmissionsScreenProps> = ({ onBack }) => {
  const admissions: AdmissionInfo[] = [
    {
      id: 'adm-001',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      admissionDate: '12 Sep 2026',
      wardName: 'Cardiac Care Unit (CCU) / Step-Down',
      roomBedNumber: 'Room 304 · Bed A',
      attendingDoctor: 'Dr. Rajesh Sharma, DM (Cardiology)',
      admissionDiagnosis: 'Acute Coronary Syndrome - Evaluated & Stabilized',
      status: 'Discharged',
      dischargeSummary: 'Patient admitted via Emergency for evaluation of retrosternal chest pain. Coronary angiogram revealed non-obstructive CAD. Medically managed with statin, antiplatelet, and ACE-inhibitor. Hemodynamically stable at discharge.',
    },
  ];

  const handleDownloadSummary = () => {
    Alert.alert('Discharge Summary', 'Downloading formal signed Hospital Discharge Summary & Medication Instructions PDF.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Hospital Admissions" subtitle="Inpatient IPD records & bed stay history" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.container}>
        {admissions.map((adm) => (
          <Card key={adm.id} style={styles.admCard}>
            <View style={styles.admHeader}>
              <View>
                <Text style={styles.hospName}>{adm.hospitalName}</Text>
                <Text style={styles.admDate}>Admitted on {adm.admissionDate}</Text>
              </View>
              <Badge label={adm.status} variant="success" />
            </View>

            <View style={styles.bedDetailsRow}>
              <View>
                <Text style={styles.detailLabel}>WARD & ACCOMMODATION</Text>
                <Text style={styles.detailValue}>{adm.wardName}</Text>
                <Text style={styles.roomBedText}>{adm.roomBedNumber}</Text>
              </View>
            </View>

            <View style={styles.doctorBox}>
              <Text style={styles.detailLabel}>ATTENDING CLINICIAN</Text>
              <Text style={styles.doctorName}>{adm.attendingDoctor}</Text>
            </View>

            <View style={styles.diagnosisBox}>
              <Text style={styles.detailLabel}>ADMISSION DIAGNOSIS</Text>
              <Text style={styles.diagnosisText}>{adm.admissionDiagnosis}</Text>
            </View>

            {adm.dischargeSummary && (
              <View style={styles.summaryBox}>
                <Text style={styles.detailLabel}>DISCHARGE SUMMARY & COURSE IN HOSPITAL</Text>
                <Text style={styles.summaryText}>{adm.dischargeSummary}</Text>
              </View>
            )}

            <Button
              title="Download Official Discharge Summary (PDF)"
              onPress={handleDownloadSummary}
              variant="outline"
              size="sm"
            />
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 60 },
  admCard: { marginBottom: spacing.lg },
  admHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  hospName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  admDate: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  bedDetailsRow: { backgroundColor: colors.surfaceSubtle, padding: spacing.sm, borderRadius: 8, marginBottom: spacing.sm },
  detailLabel: { fontSize: 9, fontWeight: typography.weights.bold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textPrimary },
  roomBedText: { fontSize: 11, color: colors.primaryDark, marginTop: 1 },
  doctorBox: { backgroundColor: '#F8FAFC', padding: spacing.sm, borderRadius: 8, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  doctorName: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textPrimary },
  diagnosisBox: { backgroundColor: colors.primarySurface, padding: spacing.sm, borderRadius: 8, marginBottom: spacing.sm },
  diagnosisText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.primaryDark },
  summaryBox: { backgroundColor: '#F8FAFC', padding: spacing.sm, borderRadius: 8, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  summaryText: { fontSize: 11, color: colors.textSecondary, lineHeight: 17 },
});

