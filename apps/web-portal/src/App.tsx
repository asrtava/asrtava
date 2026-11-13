import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HospitalProvider } from './context/HospitalContext';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { SuperAdminDashboard } from './portals/super-admin/SuperAdminDashboard';
import { GroupAdminDashboard } from './portals/group-admin/GroupAdminDashboard';
import { HospitalAdminDashboard } from './portals/hospital-admin/HospitalAdminDashboard';
import { DoctorDashboard } from './portals/doctor/DoctorDashboard';
import { ReceptionDashboard } from './portals/reception/ReceptionDashboard';
import { NursingDashboard } from './portals/nursing/NursingDashboard';
import { PharmacyDashboard } from './portals/pharmacy/PharmacyDashboard';
import { LaboratoryDashboard } from './portals/laboratory/LaboratoryDashboard';
import { RadiologyDashboard } from './portals/radiology/RadiologyDashboard';
import { FinanceDashboard } from './portals/finance/FinanceDashboard';
import { HRDashboard } from './portals/hr/HRDashboard';
import { InventoryDashboard } from './portals/inventory/InventoryDashboard';
import { OTDashboard } from './portals/ot/OTDashboard';
import { EmergencyDashboard } from './portals/emergency/EmergencyDashboard';
import { CoordinationDashboard } from './portals/coordination/CoordinationDashboard';
import { PatientDashboard } from './portals/patient/PatientDashboard';

// Public & 5-Application Entry Views
import { PublicHomePage } from './public/PublicHomePage';
import { StaffLogin } from './auth/StaffLogin';
import { PatientLogin } from './auth/PatientLogin';
import { CoordinationLogin } from './auth/CoordinationLogin';
import { SuperAdminLogin } from './auth/SuperAdminLogin';
import { RoleLoginView } from './auth/RoleLoginView';
import { HospitalRegistration } from './auth/HospitalRegistration';
import { OnboardingWizard } from './auth/OnboardingWizard';
import { HospitalOnboardingWorkspace } from './portals/onboarding/HospitalOnboardingWorkspace';
import { resolveApplicationExperience } from './utils/appResolver';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const MainPortalView: React.FC = () => {
  const { user, activePortal, setActivePortal, currentAuthView, setCurrentAuthView } = useAuth();
  const [resumptionToken, setResumptionToken] = React.useState<string | null>(null);

  // Initialize view from subdomain or path on first load
  useEffect(() => {
    if (!user && (!currentAuthView || currentAuthView === '/')) {
      const app = resolveApplicationExperience();
      if (app === 'staff') {
        setCurrentAuthView('/login/staff');
      } else if (app === 'patient') {
        setCurrentAuthView('/login/patient');
      } else if (app === 'network') {
        setCurrentAuthView('/login/coordination');
      } else if (app === 'admin') {
        setCurrentAuthView('/super-admin/login');
      }
    }
  }, [user]);

  // Authenticated user returning to view Public Homepage
  if (user && (currentAuthView === 'public-home' || currentAuthView === '/')) {
    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setCurrentAuthView(null)}
            className="text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 border border-teal-500 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Workspace ({user.firstName || 'Dashboard'})</span>
          </button>
        </div>
        <PublicHomePage onNavigate={(route) => {
          if (route === 'portal' || route === '/portal') {
            setCurrentAuthView(null);
          } else {
            setCurrentAuthView(route);
          }
        }} />
      </div>
    );
  }

  // Authenticated user viewing Hospital Onboarding Workspace
  if (user && (currentAuthView === '/onboarding' || currentAuthView === '/hospital-onboarding')) {
    return (
      <HospitalOnboardingWorkspace
        onExit={() => setCurrentAuthView(null)}
      />
    );
  }

  // 1. Unauthenticated Visitor Flow: Public Website & Purpose-Built Application Logins
  if (!user) {
    if (!currentAuthView || currentAuthView === '/') {
      return <PublicHomePage onNavigate={setCurrentAuthView} />;
    }

    // App 2: Hospital Staff Application Login
    if (currentAuthView === '/login/staff' || currentAuthView === '/app' || currentAuthView === '/staff') {
      return (
        <div className="relative">
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setCurrentAuthView('/')}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 shadow-md flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Homepage</span>
            </button>
          </div>
          <StaffLogin onSwitchPortal={setCurrentAuthView} />
        </div>
      );
    }

    // App 3: Patient Portal Login
    if (currentAuthView === '/login/patient' || currentAuthView === '/patient') {
      return (
        <div className="relative">
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setCurrentAuthView('/')}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 shadow-md flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Homepage</span>
            </button>
          </div>
          <PatientLogin onSwitchPortal={setCurrentAuthView} />
        </div>
      );
    }

    // App 4: Healthcare Coordination Network Login
    if (currentAuthView === '/login/coordination' || currentAuthView === '/network' || currentAuthView === '/coordination') {
      return (
        <CoordinationLogin onSwitchPortal={setCurrentAuthView} />
      );
    }

    // App 5: Platform Administration Console Login
    if (currentAuthView === '/super-admin/login' || currentAuthView === '/admin' || currentAuthView === '/super-admin') {
      return (
        <div className="relative">
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setCurrentAuthView('/')}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 shadow-md flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Homepage</span>
            </button>
          </div>
          <SuperAdminLogin onSwitchPortal={setCurrentAuthView} />
        </div>
      );
    }

    // Legacy individual role login router (e.g. /login/doctor)
    if (currentAuthView.startsWith('/login/')) {
      const roleSlug = currentAuthView.replace('/login/', '');
      return <RoleLoginView roleSlug={roleSlug} onNavigate={setCurrentAuthView} />;
    }

    if (currentAuthView === '/register-hospital') {
      return (
        <div className="relative">
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setCurrentAuthView('/')}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 shadow-md flex items-center space-x-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Homepage</span>
            </button>
          </div>
          <HospitalRegistration
            onSwitchPortal={setCurrentAuthView}
            onLaunchOnboarding={(token) => {
              setResumptionToken(token);
              setCurrentAuthView('/onboarding');
            }}
          />
        </div>
      );
    }

    if (currentAuthView === '/onboarding' || currentAuthView === '/hospital-onboarding') {
      return (
        <HospitalOnboardingWorkspace
          onExit={() => setCurrentAuthView('/')}
        />
      );
    }

    // Default to Public Homepage
    return <PublicHomePage onNavigate={setCurrentAuthView} />;
  }

  // 2. Strict Access Control & Role Authorization Check
  const isAuthorized = user.authorizedPortals && user.authorizedPortals.includes(activePortal);

  if (!isAuthorized) {
    const primaryAuthorized = user.authorizedPortals[0] || 'doctor';
    return (
      <AppShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Access Denied: Unauthorized Workspace
          </h2>
          <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
            Your account ({user.email}) does not hold an authorized role assignment for the{' '}
            <strong className="text-slate-900 uppercase font-mono">{activePortal}</strong> workspace in this hospital tenant.
          </p>
          <div className="mt-4 p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 font-medium">
            Assigned Roles: {user.assignedRoles?.join(', ') || 'Standard User'}
          </div>
          <button
            onClick={() => setActivePortal(primaryAuthorized)}
            className="mt-6 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
          >
            Switch to Authorized Workspace ({primaryAuthorized})
          </button>
        </div>
      </AppShell>
    );
  }

  const renderActivePortal = () => {
    switch (activePortal) {
      case 'super-admin':
        return <SuperAdminDashboard />;
      case 'group-admin':
        return <GroupAdminDashboard />;
      case 'hospital-admin':
        return <HospitalAdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'reception':
        return <ReceptionDashboard />;
      case 'nursing':
        return <NursingDashboard />;
      case 'pharmacy':
        return <PharmacyDashboard />;
      case 'laboratory':
        return <LaboratoryDashboard />;
      case 'radiology':
        return <RadiologyDashboard />;
      case 'finance':
        return <FinanceDashboard />;
      case 'hr':
        return <HRDashboard />;
      case 'inventory':
        return <InventoryDashboard />;
      case 'ot':
        return <OTDashboard />;
      case 'emergency':
        return <EmergencyDashboard />;
      case 'coordination':
        return <CoordinationDashboard />;
      case 'patient':
        return <PatientDashboard />;
      default:
        return (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center py-16">
            <div className="w-12 h-12 bg-brand-50 text-brand-700 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-lg">
              A
            </div>
            <h2 className="text-xl font-bold text-slate-900 capitalize tracking-tight">
              {activePortal} Workspace
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              This dedicated role-specific portal is bound to the ASRTAVA Centralized Permission Engine and PostgreSQL Row-Level Security.
            </p>
          </div>
        );
    }
  };

  return <AppShell>{renderActivePortal()}</AppShell>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <HospitalProvider>
        <ToastProvider>
          <MainPortalView />
        </ToastProvider>
      </HospitalProvider>
    </AuthProvider>
  );
};

export default App;
