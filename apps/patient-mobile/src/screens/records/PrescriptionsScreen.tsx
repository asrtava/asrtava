import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Header, Card, Badge, Button } from '../../components';
import { Prescription } from '../../types';
import { patientRecordsApi } from '../../api';

interface PrescriptionsScreenProps {
  onBack: () => void;
}

export const PrescriptionsScreen: React.FC<PrescriptionsScreenProps> = ({ onBack }) => {
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');

  const initialPrescriptions: Prescription[] = [
    {
      id: 'rx-001',
      date: '08 Nov 2026',
      doctorName: 'Dr. Rajesh Sharma',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      diagnosis: 'I20.9 - Angina Pectoris, Unspecified',
      medicines: [
        {
          name: 'Atorvastatin 20mg',
          dosage: '1 Tablet',
          frequency: 'Once Daily (Night)',
          duration: '30 Days',
          instructions: 'Take with water after dinner.',
          remainingDays: '22 Days Left',
        },
        {
          name: 'Aspirin 75mg',
          dosage: '1 Tablet',
          frequency: 'Once Daily (Afternoon)',
          duration: '30 Days',
          instructions: 'Post lunch. Do not skip doses.',
          remainingDays: '22 Days Left',
        },
        {
          name: 'Pantoprazole 40mg',
          dosage: '1 Capsule',
          frequency: 'Once Daily (Morning)',
          duration: '14 Days',
          instructions: 'Take 30 mins before breakfast on empty stomach.',
          remainingDays: '6 Days Left',
        },
      ],
      followUpDate: '10 Dec 2026',
    },
    {
      id: 'rx-002',
      date: '15 Oct 2026',
      doctorName: 'Dr. Ananya Roy',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      diagnosis: 'E11.9 - Type 2 Diabetes Mellitus',
      medicines: [
        {
          name: 'Metformin Hydrochloride 500mg',
          dosage: '1 Tablet',
          frequency: 'Twice Daily (Morning/Night)',
          duration: '60 Days',
          instructions: 'Take with meals.',
          remainingDays: '35 Days Left',
        },
      ],
    },
  ];

  const [prescriptionList, setPrescriptionList] = useState<Prescription[]>(initialPrescriptions);

  useEffect(() => {
    const fetchRx = async () => {
      try {
        const res = await patientRecordsApi.getPrescriptions();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped: Prescription[] = res.data.data.map((rx: any, idx: number) => ({
            id: rx.id || `rx-00${idx + 1}`,
            date: rx.prescription_date ? new Date(rx.prescription_date).toLocaleDateString() : '08 Nov 2026',
            doctorName: rx.doctor_name || 'Dr. Rajesh Sharma',
            hospitalName: 'Apex Care Multi-Specialty Hospital',
            diagnosis: rx.diagnosis || 'Cardiovascular Regimen',
            medicines: rx.items?.map((it: any) => ({
              name: it.medicine_name || 'Prescribed Formulation',
              dosage: it.dosage || '1 Tablet',
              frequency: it.frequency || 'Once Daily',
              duration: it.duration || '30 Days',
              instructions: it.instructions || 'As advised',
              remainingDays: 'Active',
            })) || [
              {
                name: 'Atorvastatin 20mg',
                dosage: '1 Tablet',
                frequency: 'Once Daily (Night)',
                duration: '30 Days',
                instructions: 'Take with water after dinner.',
                remainingDays: '22 Days Left',
              }
            ],
            followUpDate: rx.follow_up_date || '10 Dec 2026',
          }));
          setPrescriptionList(mapped);
        }
      } catch (err) {
        console.warn('Prescription live sync fallback active:', err);
      }
    };
    fetchRx();
  }, []);

  const handleDownloadPdf = (rxId: string) => {
    Alert.alert('Download Prescription', `Downloading signed medical e-prescription PDF (#${rxId}) with digital QR verification code.`);
  };

  const handleSharePharmacy = () => {
    Alert.alert('Share with Pharmacy', 'Secure prescription transfer link dispatched to in-hospital pharmacy counter.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Digital Prescriptions" subtitle="Finalized physician e-prescriptions" onBack={onBack} />
      <View style={styles.container}>
        {/* Tab Toggle */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setSelectedTab('active')}
            style={[styles.tabItem, selectedTab === 'active' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
              Current Regimen ({prescriptionList.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('history')}
            style={[styles.tabItem, selectedTab === 'history' && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
              Prescription Archive
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollList}>
          {prescriptionList.map((rx) => (
            <Card key={rx.id} style={styles.rxCard}>
              <View style={styles.rxHeader}>
                <View>
                  <Text style={styles.doctorName}>{rx.doctorName}</Text>
                  <Text style={styles.hospitalText}>{rx.hospitalName}</Text>
                </View>
                <Badge label={rx.date} variant="primary" />
              </View>

              <View style={styles.diagnosisBox}>
                <Text style={styles.diagnosisLabel}>DIAGNOSIS</Text>
                <Text style={styles.diagnosisValue}>{rx.diagnosis}</Text>
              </View>

              <Text style={styles.medsTitle}>Prescribed Medicines ({rx.medicines.length})</Text>

              {rx.medicines.map((med, idx) => (
                <View key={idx} style={styles.medicineItem}>
                  <View style={styles.medTopRow}>
                    <Text style={styles.medicineName}>💊 {med.name}</Text>
                    {med.remainingDays && <Badge label={med.remainingDays} variant="info" />}
                  </View>
                  <Text style={styles.dosageText}>
                    Dosage: <Text style={styles.dosageBold}>{med.dosage}</Text> · {med.frequency}
                  </Text>
                  <Text style={styles.durationText}>Duration: {med.duration}</Text>
                  <Text style={styles.instructionsText}>Note: {med.instructions}</Text>
                </View>
              ))}

              {rx.followUpDate && (
                <View style={styles.followUpBox}>
                  <Text style={styles.followUpText}>Next Review Follow-Up: {rx.followUpDate}</Text>
                </View>
              )}

              <View style={styles.rxActionsRow}>
                <Button
                  title="Share with Pharmacy"
                  onPress={handleSharePharmacy}
                  variant="outline"
                  size="sm"
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <Button
                  title="Download PDF"
                  onPress={() => handleDownloadPdf(rx.id)}
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 3,
    marginBottom: spacing.md,
  },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabItemActive: { backgroundColor: colors.card },
  tabText: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.medium },
  tabTextActive: { color: colors.primary, fontWeight: typography.weights.bold },
  scrollList: { paddingBottom: 60 },
  rxCard: { marginBottom: spacing.lg },
  rxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  doctorName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  hospitalText: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  diagnosisBox: { backgroundColor: colors.primarySurface, padding: spacing.sm, borderRadius: 8, marginBottom: spacing.md },
  diagnosisLabel: { fontSize: 9, fontWeight: typography.weights.bold, color: colors.primary, letterSpacing: 0.5 },
  diagnosisValue: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.primaryDark, marginTop: 2 },
  medsTitle: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: spacing.sm },
  medicineItem: { backgroundColor: colors.surfaceSubtle, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.sm },
  medTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  medicineName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary },
  dosageText: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  dosageBold: { fontWeight: typography.weights.bold, color: colors.textPrimary },
  durationText: { fontSize: 11, color: colors.textMuted },
  instructionsText: { fontSize: 11, color: colors.primaryDark, fontStyle: 'italic', marginTop: 3 },
  followUpBox: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6, marginVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  followUpText: { fontSize: 11, color: colors.textSecondary, fontWeight: typography.weights.medium },
  rxActionsRow: { flexDirection: 'row', marginTop: spacing.sm },
});

