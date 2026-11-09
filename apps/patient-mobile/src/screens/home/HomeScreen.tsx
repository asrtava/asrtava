import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Card, Badge, Button } from '../../components';
import { PatientProfile, HospitalSummary, Appointment, Prescription, LabReport } from '../../types';
import { patientAppointmentsApi } from '../../api';

interface HomeScreenProps {
  patient: PatientProfile;
  activeHospital: HospitalSummary;
  linkedHospitals: HospitalSummary[];
  onSwitchHospital: (hosp: HospitalSummary) => void;
  onNavigate: (screen: string, params?: any) => void;
  onOpenNotifications: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  patient,
  activeHospital,
  linkedHospitals,
  onSwitchHospital,
  onNavigate,
  onOpenNotifications,
}) => {
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment>({
    id: 'apt-001',
    tokenNumber: 'Token #14',
    doctorName: 'Dr. Rajesh Sharma',
    specialty: 'Chief of Cardiology',
    hospitalName: activeHospital.name,
    hospitalId: activeHospital.id,
    date: 'Mon, 10 Nov 2026',
    time: '10:15 AM',
    type: 'In-Person',
    status: 'Confirmed',
    queueEstimate: 'Approx 15 mins wait',
  });

  useEffect(() => {
    const fetchAppt = async () => {
      try {
        const res = await patientAppointmentsApi.getMyAppointments();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const a = res.data.data[0];
          setUpcomingAppointment({
            id: a.id || 'apt-001',
            tokenNumber: `Token #${a.queue_token_number || 14}`,
            doctorName: a.doctor_name || 'Dr. Rajesh Sharma',
            specialty: a.department_name || 'Cardiology',
            hospitalName: activeHospital.name,
            hospitalId: activeHospital.id,
            date: a.appointment_date ? new Date(a.appointment_date).toLocaleDateString() : 'Mon, 10 Nov 2026',
            time: a.start_time || '10:15 AM',
            type: 'In-Person',
            status: a.status === 'completed' ? 'Completed' : 'Confirmed',
            queueEstimate: 'Estimated wait: 15 mins'
          });
        }
      } catch (err) {
        console.warn('Upcoming appointment sync fallback active:', err);
      }
    };
    fetchAppt();
  }, [activeHospital.id]);

  const quickActions = [
    { id: 'book', label: 'Book Visit', icon: '📅', screen: 'book_appointment' },
    { id: 'doctors', label: 'Find Doctor', icon: '🩺', screen: 'doctors' },
    { id: 'rx', label: 'Prescriptions', icon: '💊', screen: 'prescriptions' },
    { id: 'lab', label: 'Lab Reports', icon: '🔬', screen: 'lab_reports' },
    { id: 'radiology', label: 'Radiology', icon: '🩻', screen: 'radiology' },
    { id: 'bills', label: 'Pay Bills', icon: '💳', screen: 'billing' },
    { id: 'ipd', label: 'Admissions', icon: '🛏️', screen: 'admissions' },
    { id: 'docs', label: 'Upload Files', icon: '📁', screen: 'documents' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greetingText}>Good morning,</Text>
            <Text style={styles.patientName}>{patient.name}</Text>
          </View>
          <View style={styles.topBarActions}>
            <TouchableOpacity onPress={onOpenNotifications} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigate('profile')}
              style={[styles.iconButton, styles.profileAvatarButton]}
            >
              <Text style={styles.avatarLetter}>{patient.name.charAt(0)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Multi-Hospital Tenant Context Switcher */}
        <Card style={styles.hospitalSwitcherCard}>
          <View style={styles.hospitalSwitcherHeader}>
            <View style={styles.hospitalPinRow}>
              <Text style={styles.hospitalPinIcon}>🏥</Text>
              <View>
                <Text style={styles.activeHospitalLabel}>Current Hospital Facility</Text>
                <Text style={styles.activeHospitalName}>{activeHospital.name}</Text>
              </View>
            </View>
            <Badge label={activeHospital.code} variant="primary" />
          </View>

          {linkedHospitals.length > 1 && (
            <View style={styles.linkedHospitalsRow}>
              <Text style={styles.switchLabel}>Switch Hospital Context:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {linkedHospitals.map((hosp) => (
                  <TouchableOpacity
                    key={hosp.id}
                    onPress={() => onSwitchHospital(hosp)}
                    style={[
                      styles.hospitalChip,
                      hosp.id === activeHospital.id && styles.hospitalChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.hospitalChipText,
                        hosp.id === activeHospital.id && styles.hospitalChipTextActive,
                      ]}
                    >
                      {hosp.name.split(' ')[0]} ({hosp.code})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </Card>

        {/* Patient Identity & Medical Alert Bar */}
        <View style={styles.uhidBadgeRow}>
          <View style={styles.uhidContainer}>
            <Text style={styles.uhidLabel}>UHID:</Text>
            <Text style={styles.uhidValue}>{patient.uhid}</Text>
          </View>
          <View style={styles.vitalsRow}>
            <Text style={styles.vitalPill}>Blood: {patient.bloodGroup}</Text>
            <Text style={styles.vitalPill}>Age: {patient.age}y</Text>
          </View>
        </View>

        {patient.allergies && patient.allergies.length > 0 && (
          <View style={styles.allergyWarningBar}>
            <Text style={styles.allergyIcon}>⚠️</Text>
            <Text style={styles.allergyText}>
              Allergies: <Text style={styles.allergyBold}>{patient.allergies.join(', ')}</Text>
            </Text>
          </View>
        )}

        {/* Upcoming Appointment Widget */}
        <Card style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <View>
              <Badge label="Upcoming Consultation" variant="success" />
              <Text style={styles.doctorName}>{upcomingAppointment.doctorName}</Text>
              <Text style={styles.doctorSpecialty}>{upcomingAppointment.specialty}</Text>
            </View>
            <View style={styles.tokenBox}>
              <Text style={styles.tokenNumber}>{upcomingAppointment.tokenNumber}</Text>
              <Text style={styles.queueEstimate}>{upcomingAppointment.queueEstimate}</Text>
            </View>
          </View>

          <View style={styles.appointmentDetailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📅</Text>
              <Text style={styles.detailText}>{upcomingAppointment.date}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>⏰</Text>
              <Text style={styles.detailText}>{upcomingAppointment.time}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>OPD Room 204</Text>
            </View>
          </View>

          <View style={styles.appointmentActions}>
            <Button
              title="View QR Check-In & Details"
              onPress={() => onNavigate('appointment_details', { appointment: upcomingAppointment })}
              variant="primary"
              size="sm"
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Quick Action Grid (8 Portals) */}
        <Text style={styles.sectionTitle}>Healthcare Services</Text>
        <View style={styles.gridContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.7}
              onPress={() => onNavigate(action.screen)}
              style={styles.gridTile}
            >
              <View style={styles.tileIconCircle}>
                <Text style={styles.tileIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.tileLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Health Records Summary */}
        <View style={styles.recentSummaryHeader}>
          <Text style={styles.sectionTitle}>Active Medications</Text>
          <TouchableOpacity onPress={() => onNavigate('prescriptions')}>
            <Text style={styles.viewAllText}>View All Prescriptions →</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.medicineSummaryCard}>
          <View style={styles.medItem}>
            <View>
              <Text style={styles.medName}>Atorvastatin 20mg</Text>
              <Text style={styles.medInstruction}>1 Tab Daily (Night) · Post Food</Text>
            </View>
            <Badge label="22 Days Left" variant="info" />
          </View>
          <View style={styles.divider} />
          <View style={styles.medItem}>
            <View>
              <Text style={styles.medName}>Aspirin 75mg</Text>
              <Text style={styles.medInstruction}>1 Tab Daily (After Lunch)</Text>
            </View>
            <Badge label="22 Days Left" variant="info" />
          </View>
        </Card>

        {/* 24/7 Emergency Support Contact */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigate('emergency_contact')}
          style={styles.emergencyCard}
        >
          <View style={styles.emergencyLeft}>
            <Text style={styles.emergencyIcon}>🚑</Text>
            <View>
              <Text style={styles.emergencyTitle}>24/7 Hospital Emergency Helpdesk</Text>
              <Text style={styles.emergencySubtitle}>Instant ambulance dispatch & trauma intake</Text>
            </View>
          </View>
          <Text style={styles.emergencyCallText}>Call Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  greetingText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  patientName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonText: {
    fontSize: 18,
  },
  profileAvatarButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  avatarLetter: {
    color: colors.textInverted,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },

  // Hospital Switcher
  hospitalSwitcherCard: {
    backgroundColor: colors.primarySurface,
    borderColor: colors.primaryBorder,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  hospitalSwitcherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hospitalPinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalPinIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  activeHospitalLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  activeHospitalName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primaryDark,
  },
  linkedHospitalsRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.primaryBorder,
  },
  switchLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  hospitalChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.card,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hospitalChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hospitalChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  hospitalChipTextActive: {
    color: colors.textInverted,
    fontWeight: typography.weights.bold,
  },

  // UHID Bar
  uhidBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  uhidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uhidLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginRight: 4,
  },
  uhidValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  vitalsRow: {
    flexDirection: 'row',
  },
  vitalPill: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: spacing.xs,
  },
  allergyWarningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  allergyIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  allergyText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
  },
  allergyBold: {
    fontWeight: typography.weights.bold,
  },

  // Appointment Card
  appointmentCard: {
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  doctorName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  doctorSpecialty: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  tokenBox: {
    alignItems: 'flex-end',
  },
  tokenNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  queueEstimate: {
    fontSize: 10,
    color: colors.textMuted,
  },
  appointmentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  detailText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  appointmentActions: {
    flexDirection: 'row',
  },

  // Grid
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  gridTile: {
    width: '23%',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tileIcon: {
    fontSize: 20,
  },
  tileLabel: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },

  // Summary
  recentSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  viewAllText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  medicineSummaryCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  medItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  medName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  medInstruction: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  // Emergency Card
  emergencyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    padding: spacing.md,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  emergencyTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#991B1B',
  },
  emergencySubtitle: {
    fontSize: 10,
    color: '#B91C1C',
  },
  emergencyCallText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#DC2626',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
