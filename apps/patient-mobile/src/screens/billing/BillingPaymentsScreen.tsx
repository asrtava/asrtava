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
import { PatientInvoice } from '../../types';
import { patientRecordsApi } from '../../api';

interface BillingPaymentsScreenProps {
  onBack: () => void;
}

export const BillingPaymentsScreen: React.FC<BillingPaymentsScreenProps> = ({ onBack }) => {
  const [invoices, setInvoices] = useState<PatientInvoice[]>([
    {
      id: 'inv-001',
      invoiceNumber: 'INV-2026-1043',
      date: '08 Nov 2026',
      category: 'OPD Consultation + Pharmacy Medicines',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      totalAmount: 1491,
      paymentStatus: 'Paid',
      paymentMethod: 'UPI (Google Pay)',
    },
    {
      id: 'inv-002',
      invoiceNumber: 'INV-2026-1088',
      date: '08 Nov 2026',
      category: 'LIMS Comprehensive Pathology Panel',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      totalAmount: 1850,
      paymentStatus: 'Unpaid',
    },
    {
      id: 'inv-003',
      invoiceNumber: 'INV-2026-0912',
      date: '15 Oct 2026',
      category: 'OPD Review Consultation',
      hospitalName: 'Apex Care Multi-Specialty Hospital',
      totalAmount: 600,
      paymentStatus: 'Paid',
      paymentMethod: 'Credit Card',
    },
  ]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await patientRecordsApi.getInvoices();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped: PatientInvoice[] = res.data.data.map((inv: any, idx: number) => ({
            id: inv.id || `inv-00${idx + 1}`,
            invoiceNumber: inv.invoice_number || `INV-2026-${1000 + idx}`,
            date: inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '08 Nov 2026',
            category: inv.notes || 'Hospital Healthcare Service',
            hospitalName: 'Apex Care Multi-Specialty Hospital',
            totalAmount: inv.total_amount ? Number(inv.total_amount) : 1000,
            paymentStatus: inv.status === 'paid' ? 'Paid' : 'Unpaid',
            paymentMethod: inv.payment_mode || (inv.status === 'paid' ? 'Online' : undefined),
          }));
          setInvoices(mapped);
        }
      } catch (err) {
        console.warn('Invoices live sync fallback active:', err);
      }
    };
    fetchInvoices();
  }, []);

  const handlePayNow = (inv: PatientInvoice) => {
    Alert.alert(
      'Online Payment Gateway',
      `Pay ₹ ${inv.totalAmount}.00 for ${inv.category} via Razorpay / UPI?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay via UPI / Card',
          onPress: () => {
            // Update invoice state
            setInvoices(prev =>
              prev.map(i => i.id === inv.id ? { ...i, paymentStatus: 'Paid', paymentMethod: 'UPI' } : i)
            );
            Alert.alert('Payment Successful', `Receipt generated for invoice ${inv.invoiceNumber}. Account balance cleared.`);
          },
        },
      ]
    );
  };

  const handleDownloadReceipt = (invNumber: string) => {
    Alert.alert('Download Receipt', `Downloading official hospital payment receipt for ${invNumber} with GST breakdown.`);
  };

  const outstandingBalance = invoices
    .filter(i => i.paymentStatus === 'Unpaid')
    .reduce((acc, i) => acc + i.totalAmount, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Hospital Bills & Payments" subtitle="OPD, IPD & pharmacy accounts" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Outstanding Balance Banner */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Outstanding Balance</Text>
          <Text style={styles.balanceAmount}>₹ {outstandingBalance.toLocaleString('en-IN')}.00</Text>
          <Text style={styles.balanceSubtitle}>
            {outstandingBalance > 0 ? '1 Unsettled diagnostic invoice due' : 'All hospital accounts settled'}
          </Text>
        </Card>

        {/* Invoice List */}
        <Text style={styles.sectionTitle}>Invoice Ledger</Text>
        {invoices.map((inv) => (
          <Card key={inv.id} style={styles.invoiceCard}>
            <View style={styles.invoiceTop}>
              <View>
                <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
                <Text style={styles.hospitalText}>{inv.hospitalName}</Text>
              </View>
              <Badge
                label={inv.paymentStatus}
                variant={inv.paymentStatus === 'Paid' ? 'success' : 'danger'}
              />
            </View>

            <View style={styles.categoryRow}>
              <Text style={styles.categoryText}>{inv.category}</Text>
              <Text style={styles.dateText}>{inv.date}</Text>
            </View>

            <View style={styles.amountRow}>
              <View>
                <Text style={styles.totalLabel}>Amount Due (Incl. GST)</Text>
                <Text style={styles.totalAmount}>₹ {inv.totalAmount.toLocaleString('en-IN')}.00</Text>
                {inv.paymentMethod && <Text style={styles.methodText}>Paid via {inv.paymentMethod}</Text>}
              </View>

              <View style={styles.actionBlock}>
                {inv.paymentStatus === 'Unpaid' ? (
                  <Button
                    title="Pay Online"
                    onPress={() => handlePayNow(inv)}
                    variant="primary"
                    size="sm"
                  />
                ) : (
                  <Button
                    title="Download Receipt"
                    onPress={() => handleDownloadReceipt(inv.invoiceNumber)}
                    variant="outline"
                    size="sm"
                  />
                )}
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
  balanceCard: { backgroundColor: colors.primaryDark, padding: spacing.lg, marginBottom: spacing.lg },
  balanceLabel: { fontSize: typography.sizes.xs, color: colors.primaryBorder, textTransform: 'uppercase', fontWeight: typography.weights.bold },
  balanceAmount: { fontSize: 32, fontWeight: typography.weights.bold, color: colors.textInverted, marginVertical: spacing.xs },
  balanceSubtitle: { fontSize: 11, color: '#A7F3D0' },
  sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  invoiceCard: { marginBottom: spacing.md },
  invoiceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  invoiceNumber: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary, fontFamily: 'monospace' },
  hospitalText: { fontSize: 10, color: colors.textMuted },
  categoryRow: { marginBottom: spacing.md },
  categoryText: { fontSize: 11, color: colors.textSecondary, fontWeight: typography.weights.medium },
  dateText: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceSubtle, padding: spacing.sm, borderRadius: 8 },
  totalLabel: { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' },
  totalAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  methodText: { fontSize: 10, color: colors.success, fontWeight: typography.weights.semibold, marginTop: 2 },
  actionBlock: { minWidth: 120 },
});

