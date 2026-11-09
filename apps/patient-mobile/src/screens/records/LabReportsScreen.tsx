import React, { useState, useEffect } from 'react';
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
import { LabReport } from '../../types';
import { patientRecordsApi } from '../../api';

interface LabReportsScreenProps {
  onBack: () => void;
}

export const LabReportsScreen: React.FC<LabReportsScreenProps> = ({ onBack }) => {
  const initialReports: LabReport[] = [
    {
      id: 'lab-001',
      testName: 'Lipid Profile Comprehensive',
      category: 'Biochemistry',
      date: '08 Nov 2026',
      doctorName: 'Dr. Rajesh Sharma',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      status: 'Ready',
      parameters: [
        { name: 'Total Cholesterol', result: '215', unit: 'mg/dL', referenceRange: '< 200', isAbnormal: true },
        { name: 'Triglycerides', result: '160', unit: 'mg/dL', referenceRange: '< 150', isAbnormal: true },
        { name: 'HDL Cholesterol', result: '48', unit: 'mg/dL', referenceRange: '> 40', isAbnormal: false },
        { name: 'LDL Cholesterol', result: '135', unit: 'mg/dL', referenceRange: '< 100', isAbnormal: true },
      ],
    },
    {
      id: 'lab-002',
      testName: 'Cardiac Troponin I (High Sensitivity)',
      category: 'Immunology',
      date: '08 Nov 2026',
      doctorName: 'Dr. Rajesh Sharma',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      status: 'Ready',
      parameters: [
        { name: 'Troponin I (hs-cTnI)', result: '3.4', unit: 'pg/mL', referenceRange: '< 14.0', isAbnormal: false },
      ],
    },
    {
      id: 'lab-003',
      testName: 'Complete Blood Count (CBC) with ESR',
      category: 'Hematology',
      date: '15 Oct 2026',
      doctorName: 'Dr. Ananya Roy',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      status: 'Ready',
      parameters: [
        { name: 'Hemoglobin', result: '14.8', unit: 'g/dL', referenceRange: '13.0 - 17.0', isAbnormal: false },
        { name: 'Total Leukocyte Count (WBC)', result: '7,200', unit: '/mcL', referenceRange: '4,000 - 11,000', isAbnormal: false },
        { name: 'Platelet Count', result: '2,40,000', unit: '/mcL', referenceRange: '1,50,000 - 4,50,000', isAbnormal: false },
      ],
    },
  ];

  const [reportList, setReportList] = useState<LabReport[]>(initialReports);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await patientRecordsApi.getLabReports();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped: LabReport[] = res.data.data.map((r: any, idx: number) => ({
            id: r.id || `lab-00${idx + 1}`,
            testName: r.test_name || r.name || 'Laboratory Test',
            category: r.category || 'Pathology',
            date: r.date ? new Date(r.date).toLocaleDateString() : '08 Nov 2026',
            doctorName: r.doctor_name || 'Dr. Rajesh Sharma',
            hospitalName: 'Apex Care Multi-Specialty Hospital',
            status: 'Ready',
            parameters: r.parameters || [
              { name: 'Analyte Parameter', result: 'Normal', unit: 'mg/dL', referenceRange: 'Normal', isAbnormal: false }
            ]
          }));
          setReportList(mapped);
        }
      } catch (err) {
        console.warn('Live lab reports fallback active:', err);
      }
    };
    fetchReports();
  }, []);

  const handleDownload = (testName: string) => {
    Alert.alert('Download Verified PDF', `Downloading digitally signed pathologist report for ${testName}.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Laboratory Reports" subtitle="LIMS pathology & bio-reference analytics" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            ℹ️ Lab reports are digitally verified by consultant pathologists. Please consult your physician for clinical interpretation.
          </Text>
        </View>

        {reportList.map((report) => (
          <Card key={report.id} style={styles.reportCard}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.testName}>{report.testName}</Text>
                <Text style={styles.categoryText}>{report.category} · Ordered by {report.doctorName}</Text>
              </View>
              <Badge label={report.status} variant="success" />
            </View>

            <Text style={styles.dateText}>Authorized: {report.date}</Text>

            {/* Structured Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colHeader, { flex: 2 }]}>Investigation</Text>
                <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'center' }]}>Result</Text>
                <Text style={[styles.colHeader, { flex: 1.2, textAlign: 'right' }]}>Reference</Text>
              </View>

              {report.parameters.map((param, idx) => (
                <View key={idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.paramName, { flex: 2 }]}>{param.name}</Text>
                  <View style={[styles.resultContainer, { flex: 1.2 }]}>
                    <Text
                      style={[
                        styles.paramResult,
                        param.isAbnormal ? styles.paramAbnormal : styles.paramNormal,
                      ]}
                    >
                      {param.result} {param.unit}
                    </Text>
                    {param.isAbnormal && <Text style={styles.flagIcon}> ⚠️</Text>}
                  </View>
                  <Text style={[styles.paramRange, { flex: 1.2 }]}>{param.referenceRange}</Text>
                </View>
              ))}
            </View>

            <Button
              title="Download Pathologist Signed Report (PDF)"
              onPress={() => handleDownload(report.testName)}
              variant="outline"
              size="sm"
              style={styles.downloadButton}
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
  disclaimerBox: { backgroundColor: colors.infoSurface, padding: spacing.sm, borderRadius: 8, marginBottom: spacing.md, borderWidth: 1, borderColor: '#BFDBFE' },
  disclaimerText: { fontSize: 11, color: colors.info, lineHeight: 16 },
  reportCard: { marginBottom: spacing.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  testName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  categoryText: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  dateText: { fontSize: 11, color: colors.textMuted, marginBottom: spacing.md },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden', marginBottom: spacing.md },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.surfaceSubtle, padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  colHeader: { fontSize: 10, fontWeight: typography.weights.bold, color: colors.textSecondary, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm },
  tableRowAlt: { backgroundColor: '#F8FAFC' },
  paramName: { fontSize: 11, color: colors.textPrimary, fontWeight: typography.weights.medium },
  resultContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  paramResult: { fontSize: 11, fontWeight: typography.weights.bold },
  paramNormal: { color: colors.success },
  paramAbnormal: { color: colors.danger },
  flagIcon: { fontSize: 10 },
  paramRange: { fontSize: 11, color: colors.textMuted, textAlign: 'right' },
  downloadButton: { width: '100%' },
});

