import React, { useState } from 'react';
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
import { Header, Card, Badge, Button, Input } from '../../components';

interface DocumentUploadScreenProps {
  onBack: () => void;
}

export const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({ onBack }) => {
  const [docCategory, setDocCategory] = useState<'Previous Prescription' | 'External Lab Report' | 'Health Insurance Policy'>('Previous Prescription');
  const [docName, setDocName] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 'doc-1', name: 'Manipal_Hospital_Cardio_Discharge.pdf', category: 'Previous Medical Summary', size: '2.4 MB', date: '04 Nov 2026' },
    { id: 'doc-2', name: 'Star_Health_Insurance_Policy_Card.pdf', category: 'Health Insurance Policy', size: '1.1 MB', date: '15 Oct 2026' },
  ]);

  const handleSelectFile = () => {
    // File picker simulation
    setSelectedFileName('External_Blood_Test_Report_Oct2026.pdf');
    setDocName('Apollo Clinic Blood Test Panel');
  };

  const handleUpload = () => {
    if (!selectedFileName) {
      Alert.alert('File Selection Required', 'Please choose a PDF document or capture a clear photo of your prescription.');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const newDoc = {
        id: 'doc-' + Date.now(),
        name: selectedFileName,
        category: docCategory,
        size: '1.8 MB',
        date: 'Today',
      };
      setUploadedFiles([newDoc, ...uploadedFiles]);
      setSelectedFileName(null);
      setDocName('');
      Alert.alert('Upload Successful', 'Document securely stored in your tenant-isolated medical repository.');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Patient Document Upload" subtitle="Previous records, insurance & external scans" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Upload Form Card */}
        <Card style={styles.uploadCard}>
          <Text style={styles.sectionHeader}>Upload New Health Document</Text>
          <Text style={styles.helperText}>Files are encrypted and accessible to your attending clinicians.</Text>

          {/* Category Toggle */}
          <View style={styles.categoryPicker}>
            {(['Previous Prescription', 'External Lab Report', 'Health Insurance Policy'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setDocCategory(cat)}
                style={[styles.catPill, docCategory === cat && styles.catPillActive]}
              >
                <Text style={[styles.catText, docCategory === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* File Picker Button */}
          <TouchableOpacity onPress={handleSelectFile} style={styles.filePickerBox}>
            <Text style={styles.filePickerIcon}>📄</Text>
            <Text style={styles.filePickerTitle}>
              {selectedFileName ? selectedFileName : 'Tap to Browse Device Files or Camera'}
            </Text>
            <Text style={styles.filePickerFormat}>Supports PDF, JPG, PNG (Max 15MB)</Text>
          </TouchableOpacity>

          {selectedFileName && (
            <Input
              label="Document Label / Title"
              value={docName}
              onChangeText={setDocName}
              placeholder="e.g. Apollo Clinic Lipid Panel Oct 2026"
            />
          )}

          <Button
            title={isUploading ? 'Encrypting & Uploading...' : 'Upload to Medical Record'}
            onPress={handleUpload}
            disabled={!selectedFileName || isUploading}
            loading={isUploading}
            style={styles.uploadBtn}
          />
        </Card>

        {/* Existing Uploaded Documents List */}
        <Text style={styles.listTitle}>Previously Uploaded Documents ({uploadedFiles.length})</Text>
        {uploadedFiles.map((doc) => (
          <Card key={doc.id} style={styles.docItemCard}>
            <View style={styles.docItemTop}>
              <View style={styles.docIconBox}>
                <Text style={styles.pdfIcon}>📑</Text>
              </View>
              <View style={styles.docMeta}>
                <Text style={styles.docItemName}>{doc.name}</Text>
                <Text style={styles.docCategory}>{doc.category} · {doc.size}</Text>
              </View>
              <Badge label={doc.date} variant="primary" />
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 60 },
  uploadCard: { marginBottom: spacing.xl },
  sectionHeader: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  helperText: { fontSize: 11, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  catPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: colors.surfaceSubtle, borderWidth: 1, borderColor: colors.border, marginRight: 6, marginBottom: 6 },
  catPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 10, color: colors.textSecondary, fontWeight: typography.weights.medium },
  catTextActive: { color: colors.textInverted, fontWeight: typography.weights.bold },
  filePickerBox: { borderStyle: 'dashed', borderWidth: 2, borderColor: colors.primaryBorder, borderRadius: 12, backgroundColor: colors.primarySurface, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  filePickerIcon: { fontSize: 32, marginBottom: 4 },
  filePickerTitle: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primaryDark, textAlign: 'center' },
  filePickerFormat: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  uploadBtn: { marginTop: spacing.xs },
  listTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  docItemCard: { marginBottom: spacing.sm, padding: spacing.md },
  docItemTop: { flexDirection: 'row', alignItems: 'center' },
  docIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  pdfIcon: { fontSize: 18 },
  docMeta: { flex: 1 },
  docItemName: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textPrimary },
  docCategory: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
});

