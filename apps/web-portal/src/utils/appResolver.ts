/**
 * ASRTAVA Official Four-Portal Architecture Resolver
 * 
 * Target URL Structure:
 * 1. asrtava.com                       => 'public'     (Public Corporate Website)
 * 2. staff.asrtava.com                 => 'staff'      (01. Hospital Staff Portal)
 * 3. patient.asrtava.com               => 'patient'    (02. Patient Portal)
 * 4. onboarding.asrtava.com            => 'onboarding' (03. Customer Onboarding Portal)
 * 5. admin.asrtava.com                 => 'admin'      (04. ASRTAVA Administration)
 * 
 * Path Fallbacks (Localhost & On-Premises Single-Host):
 * - /                                  => 'public'
 * - /login/staff, /staff, /app         => 'staff'
 * - /login/patient, /patient           => 'patient'
 * - /login/onboarding, /onboarding     => 'onboarding'
 * - /super-admin/login, /admin         => 'admin'
 */

export type AsrtavaApplication = 'public' | 'staff' | 'patient' | 'onboarding' | 'admin';

export interface AppExperienceConfig {
  app: AsrtavaApplication;
  name: string;
  tagline: string;
  defaultHost: string;
  primaryPath: string;
  themeColor: string;
}

export const ASRTAVA_APPLICATIONS: Record<AsrtavaApplication, AppExperienceConfig> = {
  public: {
    app: 'public',
    name: 'ASRTAVA Corporate Website',
    tagline: 'Healthcare Technology Platform · Hospital Management & Systems Integration',
    defaultHost: 'asrtava.com',
    primaryPath: '/',
    themeColor: 'teal',
  },
  staff: {
    app: 'staff',
    name: 'Hospital Staff Portal',
    tagline: 'Operational Workspaces for Doctors, Nurses, Reception, Pharmacy & Administrators',
    defaultHost: 'staff.asrtava.com',
    primaryPath: '/login/staff',
    themeColor: 'teal',
  },
  patient: {
    app: 'patient',
    name: 'Patient Portal',
    tagline: 'Appointments, Health Records, Prescriptions, Diagnostic Reports & Bills',
    defaultHost: 'patient.asrtava.com',
    primaryPath: '/login/patient',
    themeColor: 'blue',
  },
  onboarding: {
    app: 'onboarding',
    name: 'Customer Onboarding Portal',
    tagline: 'Hospital Implementation, Facility Configuration, Data Migration & Go-Live Approvals',
    defaultHost: 'onboarding.asrtava.com',
    primaryPath: '/login/onboarding',
    themeColor: 'emerald',
  },
  admin: {
    app: 'admin',
    name: 'ASRTAVA Administration',
    tagline: 'Customer Organizations, Tenants, Perpetual Licenses & Platform Operations',
    defaultHost: 'admin.asrtava.com',
    primaryPath: '/super-admin/login',
    themeColor: 'purple',
  },
};

/**
 * Resolves current application experience from hostname, URL path, and query parameter overrides
 */
export function resolveApplicationExperience(): AsrtavaApplication {
  if (typeof window === 'undefined') return 'public';

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Explicit query parameter override (e.g. ?app=onboarding or ?app=staff)
  const appParam = searchParams.get('app')?.toLowerCase();
  if (appParam && appParam in ASRTAVA_APPLICATIONS) {
    return appParam as AsrtavaApplication;
  }

  // 2. Subdomain match (Cloud Multi-Tenant deployment)
  if (hostname.startsWith('staff.') || hostname.startsWith('app.')) return 'staff';
  if (hostname.startsWith('patient.')) return 'patient';
  if (hostname.startsWith('onboarding.')) return 'onboarding';
  if (hostname.startsWith('admin.') || hostname.startsWith('superadmin.')) return 'admin';

  // 3. Path match (Localhost, On-Premises, Preview environments)
  if (pathname.startsWith('/app') || pathname.startsWith('/staff') || pathname.startsWith('/login/staff')) {
    return 'staff';
  }
  if (pathname.startsWith('/patient') || pathname.startsWith('/login/patient')) {
    return 'patient';
  }
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/login/onboarding') || pathname.startsWith('/hospital-onboarding')) {
    return 'onboarding';
  }
  if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin') || pathname.startsWith('/login/super-admin')) {
    return 'admin';
  }

  // Default to Public Website
  return 'public';
}

