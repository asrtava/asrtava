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
import { RadiologyStudy } from '../../types';

interface RadiologyScreenProps {
  onBack: () => void;
}

export const RadiologyScreen: React.FC<RadiologyScreenProps> = ({ onBack }) => {
  const studies: RadiologyStudy[] = [
    {
      id: 'rad-001',
      orderTitle: 'Chest X-Ray PA View (Digital Radiography)',
      modality: 'X-Ray',
      date: '08 Nov 2026',
      radiologistName: 'Dr. Vivek Menon, MD (Radio-diagnosis)',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      status: 'Finalized',
      findings: 'The cardiac silhouette is within normal limits for size and configuration. The lung parenchyma appears clear bilaterally with no active focal consolidation, pleural effusion, or pneumothorax. Costophrenic and cardiophrenic angles are sharp.',
      impression: 'Normal study. No acute cardiopulmonary abnormality detected on current study.',
    },
    {
      id: 'rad-002',
      orderTitle: 'CT Coronary Angiogram (64-Slice)',
      modality: 'CT Scan',
      date: '12 Sep 2026',
      radiologistName: 'Dr. Vivek Menon, MD (Radio-diagnosis)',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      status: 'Finalized',
      findings: 'LAD shows minor calcified atheroma causing 25-30% luminal narrowing in mid segment. LCx and RCA show normal caliber without hemodynamically significant stenosis. Agatston calcium score = 42.',
      impression: 'Mild non-obstructive coronary artery disease. CAD-RADS 1.',
    },
  ];

  const handleDownloadReport = (title: string) => {
    Alert.alert('Download Radiology Report', `Downloading signed RIS report for ${title} with digital PAC-link stamp.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Radiology & Imaging" subtitle="Diagnostic RIS reports & DICOM metadata" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.container}>
        {studies.map((study) => (
          <Card key={study.id} style={styles.studyCard}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.modalityPill}>
                  <Text style={styles.modalityText}>{study.modality}</Text>
                </View>
                <Badge label={study.status} variant="success" />
              </View>
              <Text style={styles.dateText}>{study.date}</Text>
            </View>

            <Text style={styles.studyTitle}>{study.orderTitle}</Text>
            <Text style={styles.radiologistText}>Reporting Radiologist: {study.radiologistName}</Text>

            <View style={styles.findingsBox}>
              <Text style={styles.sectionHeader}>CLINICAL FINDINGS</Text>
              <Text style={styles.findingsText}>{study.findings}</Text>

              <View style={styles.divider} />

              <Text style={styles.sectionHeader}>IMPRESSION / CONCLUSION</Text>
              <Text style={styles.impressionText}>{study.impression}</Text>
            </View>

            <Button
              title="Download Radiologist Signed Report (PDF)"
              onPress={() => handleDownloadReport(study.orderTitle)}
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
  studyCard: { marginBottom: spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  modalityPill: { backgroundColor: colors.primarySurface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: spacing.xs, borderWidth: 1, borderColor: colors.primaryBorder },
  modalityText: { fontSize: 10, fontWeight: typography.weights.bold, color: colors.primary },
  dateText: { fontSize: 11, color: colors.textMuted },
  studyTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: 2 },
  radiologistText: { fontSize: 11, color: colors.textSecondary, marginBottom: spacing.md },
  findingsBox: { backgroundColor: colors.surfaceSubtle, padding: spacing.md, borderRadius: 10, marginBottom: spacing.md },
  sectionHeader: { fontSize: 9, fontWeight: typography.weights.bold, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  findingsText: { fontSize: 11, color: colors.textSecondary, lineHeight: 17 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  impressionText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primaryDark, lineHeight: 18 },
});

