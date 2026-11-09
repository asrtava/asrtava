import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from './src/theme';
import { PatientProfile, HospitalSummary, Doctor, Appointment } from './src/types';

// Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { HomeScreen } from './src/screens/home/HomeScreen';
import { DoctorDiscoveryScreen } from './src/screens/appointments/DoctorDiscoveryScreen';
import { BookAppointmentScreen } from './src/screens/appointments/BookAppointmentScreen';
import { AppointmentDetailsScreen } from './src/screens/appointments/AppointmentDetailsScreen';
import { PrescriptionsScreen } from './src/screens/records/PrescriptionsScreen';
import { LabReportsScreen } from './src/screens/records/LabReportsScreen';
import { RadiologyScreen } from './src/screens/records/RadiologyScreen';
import { BillingPaymentsScreen } from './src/screens/billing/BillingPaymentsScreen';
import { AdmissionsScreen } from './src/screens/admissions/AdmissionsScreen';
import { DocumentUploadScreen } from './src/screens/documents/DocumentUploadScreen';
import { NotificationsScreen } from './src/screens/notifications/NotificationsScreen';
import { ProfileScreen } from './src/screens/profile/ProfileScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [screenParams, setScreenParams] = useState<any>(null);

  // Patient Profile State
  const [patient, setPatient] = useState<PatientProfile>({
    id: 'pat-001',
    uhid: 'APEX-2026-00084',
    name: 'Rahul Verma',
    age: 34,
    gender: 'M',
    phone: '9876543210',
    email: 'rahul.verma@example.com',
    bloodGroup: 'O+',
    allergies: ['Penicillin (Moderate Rash)'],
    emergencyContact: {
      name: 'Sunita Verma (Spouse)',
      relationship: 'Spouse',
      phone: '+91 98765 00112',
    },
  });

  // Multi-Hospital Tenant State
  const [linkedHospitals] = useState<HospitalSummary[]>([
    {
      id: 'hosp-001',
      name: 'Apex Care Multi-Specialty Hospital',
      code: 'APEX-BLR',
      city: 'Bangalore, KA',
      isPrimary: true,
    },
    {
      id: 'hosp-002',
      name: 'Metro City Health & Trauma Center',
      code: 'METRO-DEL',
      city: 'New Delhi, DL',
      isPrimary: false,
    },
    {
      id: 'hosp-003',
      name: 'Lotus Super-Specialty Clinic',
      code: 'LOTUS-MUM',
      city: 'Mumbai, MH',
      isPrimary: false,
    },
  ]);

  const [activeHospital, setActiveHospital] = useState<HospitalSummary>(linkedHospitals[0]);

  // Handle Deep Links (asrtava://)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (url.includes('appointment/')) {
        setCurrentScreen('appointment_details');
      } else if (url.includes('prescription')) {
        setCurrentScreen('prescriptions');
      } else if (url.includes('reports')) {
        setCurrentScreen('lab_reports');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const navigateTo = (screen: string, params?: any) => {
    setScreenParams(params);
    setCurrentScreen(screen);
  };

  const handleLoginSuccess = (_token: string, patientData: any) => {
    if (patientData?.name) {
      setPatient(prev => ({ ...prev, ...patientData }));
    }
    setIsAuthenticated(true);
    setCurrentScreen('home');
  };

  const handleLogout = (allDevices = false) => {
    Alert.alert(
      allDevices ? 'Logout All Devices' : 'Logout Current Device',
      allDevices
        ? 'All active web & mobile sessions on the central server have been revoked.'
        : 'Session revoked on this device.',
      [
        {
          text: 'Confirm',
          onPress: () => {
            setIsAuthenticated(false);
            setCurrentScreen('login');
          },
        },
      ]
    );
  };

  // If user is unauthenticated, show LoginScreen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() =>
          Alert.alert('Registration', 'Redirecting to mobile OTP patient enrollment.')
        }
      />
    );
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            patient={patient}
            activeHospital={activeHospital}
            linkedHospitals={linkedHospitals}
            onSwitchHospital={(hosp) => {
              setActiveHospital(hosp);
              Alert.alert('Tenant Switched', `Active hospital set to ${hosp.name}.`);
            }}
            onNavigate={navigateTo}
            onOpenNotifications={() => setCurrentScreen('notifications')}
          />
        );
      case 'doctors':
        return (
          <DoctorDiscoveryScreen
            onBack={() => setCurrentScreen('home')}
            onSelectDoctor={(doctor: Doctor) => navigateTo('book_appointment', { doctor })}
          />
        );
      case 'book_appointment':
        return (
          <BookAppointmentScreen
            doctor={screenParams?.doctor || {
              id: 'doc-001',
              name: 'Dr. Rajesh Sharma',
              specialty: 'Chief Cardiologist',
              department: 'Cardiology',
              qualification: 'MBBS, MD, DM',
              experienceYears: 18,
              consultationFee: 800,
              hospitalName: activeHospital.name,
              availableDays: ['Mon', 'Wed', 'Fri'],
            }}
            patient={patient}
            onBack={() => setCurrentScreen('doctors')}
            onBookingSuccess={(appointment) => navigateTo('appointment_details', { appointment })}
          />
        );
      case 'appointment_details':
        return (
          <AppointmentDetailsScreen
            appointment={screenParams?.appointment || {
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
            }}
            onBack={() => setCurrentScreen('home')}
            onCancel={() => {
              Alert.alert('Cancelled', 'Your appointment has been cancelled.');
              setCurrentScreen('home');
            }}
          />
        );
      case 'prescriptions':
        return <PrescriptionsScreen onBack={() => setCurrentScreen('home')} />;
      case 'lab_reports':
        return <LabReportsScreen onBack={() => setCurrentScreen('home')} />;
      case 'radiology':
        return <RadiologyScreen onBack={() => setCurrentScreen('home')} />;
      case 'billing':
        return <BillingPaymentsScreen onBack={() => setCurrentScreen('home')} />;
      case 'admissions':
        return <AdmissionsScreen onBack={() => setCurrentScreen('home')} />;
      case 'documents':
        return <DocumentUploadScreen onBack={() => setCurrentScreen('home')} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => setCurrentScreen('home')} />;
      case 'profile':
        return (
          <ProfileScreen
            patient={patient}
            linkedHospitals={linkedHospitals}
            onBack={() => setCurrentScreen('home')}
            onLogout={handleLogout}
            onSwitchHospital={(hosp) => {
              setActiveHospital(hosp);
              Alert.alert('Tenant Switched', `Active hospital set to ${hosp.name}.`);
            }}
          />
        );
      default:
        return (
          <HomeScreen
            patient={patient}
            activeHospital={activeHospital}
            linkedHospitals={linkedHospitals}
            onSwitchHospital={setActiveHospital}
            onNavigate={navigateTo}
            onOpenNotifications={() => setCurrentScreen('notifications')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.body}>{renderCurrentScreen()}</View>

      {/* Global Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home', label: 'Home', icon: '🏠' },
          { id: 'doctors', label: 'Doctors', icon: '🩺' },
          { id: 'prescriptions', label: 'Medicines', icon: '💊' },
          { id: 'lab_reports', label: 'Reports', icon: '🔬' },
          { id: 'profile', label: 'Profile', icon: '👤' },
        ].map((tab) => {
          const isActive = currentScreen === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => setCurrentScreen(tab.id)}
              style={styles.navItem}
            >
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>{tab.icon}</Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navIconActive: {
    transform: [{ scale: 1.15 }],
  },
  navLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});
