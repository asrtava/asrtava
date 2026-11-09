import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Header, Card, Badge, Button } from '../../components';
import { Appointment } from '../../types';

interface AppointmentDetailsProps {
  appointment: Appointment;
  onBack: () => void;
  onCancel: (id: string) => void;
}

export const AppointmentDetailsScreen: React.FC<AppointmentDetailsProps> = ({
  appointment,
  onBack,
  onCancel,
}) => {
  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this scheduled consultation? The doctor slot will be released back to the general hospital queue.',
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Confirm Cancellation',
          style: 'destructive',
          onPress: () => onCancel(appointment.id),
        },
      ]
    );
  };

  const handleDirections = () => {
    Alert.alert('Hospital Navigation', 'Opening GPS maps routing to Apex Care Multi-Specialty Hospital.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Consultation Pass" subtitle={appointment.tokenNumber} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Pass Header Card with QR Simulation */}
        <Card style={styles.passCard}>
          <View style={styles.passTop}>
            <View>
              <Badge label={appointment.status} variant="success" />
              <Text style={styles.tokenText}>{appointment.tokenNumber}</Text>
              <Text style={styles.queueText}>{appointment.queueEstimate || 'On Time'}</Text>
            </View>
            <View style={styles.qrContainer}>
              <View style={styles.qrMock}>
                <Text style={styles.qrIcon}>📱</Text>
                <Text style={styles.qrLabel}>CHECK-IN QR</Text>
              </View>
            </View>
          </View>
          <View style={styles.kioskInstruction}>
            <Text style={styles.kioskText}>
              Scan this digital pass at the OPD reception self-check-in kiosk on arrival to auto-enter queue.
            </Text>
          </View>
        </Card>

        {/* Doctor & Location Details */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardHeader}>Attending Faculty</Text>
          <Text style={styles.docName}>{appointment.doctorName}</Text>
          <Text style={styles.docSpecialty}>{appointment.specialty}</Text>

          <View style={styles.divider} />

          <Text style={styles.cardHeader}>Facility & Room Details</Text>
          <Text style={styles.hospName}>{appointment.hospitalName}</Text>
          <Text style={styles.roomText}>Outpatient Wing B · 2nd Floor · Room #204</Text>

          <TouchableOpacity onPress={handleDirections} style={styles.directionsRow}>
            <Text style={styles.directionsIcon}>📍</Text>
            <Text style={styles.directionsText}>Get Driving Directions via Maps →</Text>
          </TouchableOpacity>
        </Card>

        {/* Schedule Timing Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardHeader}>Consultation Schedule</Text>
          <View style={styles.scheduleRow}>
            <View>
              <Text style={styles.timeLabel}>Appointment Date</Text>
              <Text style={styles.timeValue}>{appointment.date}</Text>
            </View>
            <View>
              <Text style={styles.timeLabel}>Reporting Time</Text>
              <Text style={styles.timeValue}>{appointment.time}</Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Reschedule Consultation Slot"
            onPress={() => Alert.alert('Reschedule', 'Please select a new date slot from doctor calendar.')}
            variant="outline"
            style={styles.actionBtn}
          />
          <Button
            title="Cancel Appointment"
            onPress={handleCancel}
            variant="danger"
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: 60 },
  passCard: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder, marginBottom: spacing.md },
  passTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tokenText: { fontSize: 28, fontWeight: typography.weights.bold, color: colors.primaryDark, marginTop: 4 },
  queueText: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  qrContainer: { alignItems: 'center' },
  qrMock: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrIcon: { fontSize: 32 },
  qrLabel: { fontSize: 8, fontWeight: typography.weights.bold, color: colors.primaryDark },
  kioskInstruction: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.primaryBorder,
  },
  kioskText: { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
  infoCard: { marginBottom: spacing.md },
  cardHeader: { fontSize: 10, color: colors.textMuted, fontWeight: typography.weights.bold, textTransform: 'uppercase', marginBottom: 4 },
  docName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  docSpecialty: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.semibold },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  hospName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary },
  roomText: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  directionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  directionsIcon: { fontSize: 14, marginRight: 4 },
  directionsText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primary },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeLabel: { fontSize: 11, color: colors.textMuted },
  timeValue: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary, marginTop: 2 },
  actionsContainer: { marginTop: spacing.sm },
  actionBtn: { marginBottom: spacing.sm },
});

