import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Header, Card, Badge, Button } from '../../components';
import { Doctor } from '../../types';
import { patientAppointmentsApi } from '../../api';

interface DoctorDiscoveryProps {
  onBack: () => void;
  onSelectDoctor: (doctor: Doctor) => void;
}

export const DoctorDiscoveryScreen: React.FC<DoctorDiscoveryProps> = ({
  onBack,
  onSelectDoctor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const specialties = ['All', 'Cardiology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Neurology'];

  const initialDoctors: Doctor[] = [
    {
      id: 'doc-001',
      name: 'Dr. Rajesh Sharma',
      specialty: 'Chief Cardiologist',
      department: 'Cardiology',
      qualification: 'MBBS, MD, DM (Cardiology), FACC',
      experienceYears: 18,
      consultationFee: 800,
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      availableDays: ['Mon', 'Wed', 'Fri'],
      nextSlot: 'Today, 04:30 PM',
    },
    {
      id: 'doc-002',
      name: 'Dr. Ananya Roy',
      specialty: 'Senior Consultant Physician',
      department: 'General Medicine',
      qualification: 'MBBS, MD (Internal Medicine)',
      experienceYears: 12,
      consultationFee: 600,
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      availableDays: ['Mon', 'Tue', 'Thu', 'Sat'],
      nextSlot: 'Tomorrow, 10:00 AM',
    },
    {
      id: 'doc-003',
      name: 'Dr. Vikram Sethi',
      specialty: 'Orthopedic & Joint Surgeon',
      department: 'Orthopedics',
      qualification: 'MBBS, MS (Ortho), MCh',
      experienceYears: 15,
      consultationFee: 750,
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      availableDays: ['Tue', 'Thu', 'Fri'],
      nextSlot: 'Wed, 11:30 AM',
    },
    {
      id: 'doc-004',
      name: 'Dr. Priya Nair',
      specialty: 'Pediatric Specialist',
      department: 'Pediatrics',
      qualification: 'MBBS, DCH, DNB (Pediatrics)',
      experienceYears: 9,
      consultationFee: 500,
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      availableDays: ['Mon', 'Wed', 'Sat'],
      nextSlot: 'Today, 06:00 PM',
    },
  ];

  const [doctorList, setDoctorList] = useState<Doctor[]>(initialDoctors);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await patientAppointmentsApi.getDoctors();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped: Doctor[] = res.data.data.map((d: any, idx: number) => ({
            id: d.id || `doc-${idx + 1}`,
            name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Dr. Specialist',
            specialty: d.specialty || d.qualification || 'Consultant',
            department: d.department_name || d.department || 'General Medicine',
            qualification: d.qualification || 'MBBS, MD',
            experienceYears: d.experience_years || 10,
            consultationFee: d.consultation_fee ? Number(d.consultation_fee) : 500,
            hospitalName: 'Apex Care Multi-Specialty Hospital',
            availableDays: ['Mon', 'Wed', 'Fri'],
            nextSlot: 'Today, 04:30 PM',
          }));
          setDoctorList(mapped);
        }
      } catch (err) {
        console.warn('Live doctor discovery fallback active:', err);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctorList.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || doc.department === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Find Specialist Doctor" subtitle="Verified medical faculty directory" onBack={onBack} />
      <View style={styles.container}>
        {/* Search Input */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by doctor name or specialty..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        {/* Specialty Filter Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtyScroll}>
          {specialties.map((spec) => (
            <TouchableOpacity
              key={spec}
              onPress={() => setSelectedSpecialty(spec)}
              style={[
                styles.specialtyPill,
                selectedSpecialty === spec && styles.specialtyPillActive,
              ]}
            >
              <Text
                style={[
                  styles.specialtyText,
                  selectedSpecialty === spec && styles.specialtyTextActive,
                ]}
              >
                {spec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Doctor List */}
        <ScrollView contentContainerStyle={styles.listContainer}>
          {filteredDoctors.map((doc) => (
            <Card key={doc.id} style={styles.doctorCard}>
              <View style={styles.doctorTopRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{doc.name.replace('Dr. ', '').charAt(0)}</Text>
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.docName}>{doc.name}</Text>
                  <Text style={styles.docSpecialty}>{doc.specialty}</Text>
                  <Text style={styles.docQualification}>{doc.qualification}</Text>
                  <Text style={styles.docExp}>{doc.experienceYears} Years Experience</Text>
                </View>
              </View>

              <View style={styles.feeSlotRow}>
                <View>
                  <Text style={styles.feeLabel}>Consultation Fee</Text>
                  <Text style={styles.feeAmount}>₹ {doc.consultationFee}</Text>
                </View>
                <View style={styles.nextSlotBox}>
                  <Text style={styles.slotLabel}>Next Available Slot</Text>
                  <Text style={styles.slotText}>{doc.nextSlot}</Text>
                </View>
              </View>

              <Button
                title="Book Appointment"
                onPress={() => onSelectDoctor(doc)}
                variant="primary"
                size="sm"
                style={styles.bookButton}
              />
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: typography.sizes.sm, color: colors.textPrimary },
  specialtyScroll: { marginBottom: spacing.md, maxHeight: 36 },
  specialtyPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  specialtyPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  specialtyText: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.medium },
  specialtyTextActive: { color: colors.textInverted, fontWeight: typography.weights.bold },
  listContainer: { paddingBottom: 60 },
  doctorCard: { marginBottom: spacing.md },
  doctorTopRow: { flexDirection: 'row', marginBottom: spacing.md },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginRight: spacing.md,
  },
  avatarText: { fontSize: 20, fontWeight: typography.weights.bold, color: colors.primary },
  doctorInfo: { flex: 1 },
  docName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  docSpecialty: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.semibold, marginTop: 1 },
  docQualification: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  docExp: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  feeSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  feeLabel: { fontSize: 10, color: colors.textMuted },
  feeAmount: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary },
  nextSlotBox: { alignItems: 'flex-end' },
  slotLabel: { fontSize: 10, color: colors.textMuted },
  slotText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.primaryDark },
  bookButton: { width: '100%' },
});

