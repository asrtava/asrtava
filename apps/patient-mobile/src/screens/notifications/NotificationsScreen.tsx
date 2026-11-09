import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Header, Card, Badge } from '../../components';
import { PatientNotification } from '../../types';

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const [notifications, setNotifications] = useState<PatientNotification[]>([
    {
      id: 'notif-1',
      title: 'Appointment Confirmed — Token #14',
      message: 'Your consultation with Dr. Rajesh Sharma is confirmed for Monday, 10 Nov at 10:15 AM at Apex Care Multi-Specialty Hospital.',
      date: '10 mins ago',
      type: 'appointment',
      isRead: false,
    },
    {
      id: 'notif-2',
      title: 'Laboratory Results Released',
      message: 'Your Lipid Profile Comprehensive report has been verified and released by the Department of Biochemistry.',
      date: '2 hours ago',
      type: 'lab',
      isRead: false,
    },
    {
      id: 'notif-3',
      title: 'Payment Receipt Issued',
      message: 'Payment of ₹ 1,491.00 for Invoice #INV-2026-1043 received successfully via UPI.',
      date: 'Yesterday',
      type: 'billing',
      isRead: true,
    },
    {
      id: 'notif-4',
      title: 'Medication Refill Reminder',
      message: 'Your prescription for Pantoprazole 40mg has 6 days remaining. Schedule a doctor review if symptoms persist.',
      date: '06 Nov 2026',
      type: 'prescription',
      isRead: true,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getIcon = (type: PatientNotification['type']) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'lab': return '🔬';
      case 'billing': return '💳';
      case 'prescription': return '💊';
      default: return '🔔';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Notifications Center"
        subtitle="Clinical alerts & booking reminders"
        onBack={onBack}
        rightAction={
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark Read</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.container}>
        {notifications.map((notif) => (
          <Card
            key={notif.id}
            style={!notif.isRead ? { ...styles.notifCard, ...styles.notifCardUnread } : styles.notifCard}
          >
            <View style={styles.notifRow}>
              <View style={styles.iconCircle}>
                <Text style={styles.typeIcon}>{getIcon(notif.type)}</Text>
              </View>
              <View style={styles.notifContent}>
                <View style={styles.topMeta}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  {!notif.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage}>{notif.message}</Text>
                <Text style={styles.notifDate}>{notif.date}</Text>
              </View>
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
  markAllText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.primary },
  notifCard: { marginBottom: spacing.sm, padding: spacing.md },
  notifCardUnread: { backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  typeIcon: { fontSize: 18 },
  notifContent: { flex: 1 },
  topMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  notifTitle: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textPrimary, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 6 },
  notifMessage: { fontSize: 11, color: colors.textSecondary, lineHeight: 16, marginBottom: 4 },
  notifDate: { fontSize: 10, color: colors.textMuted },
});
