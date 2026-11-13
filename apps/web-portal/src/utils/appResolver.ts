/**
 * ASRTAVA Unified Multi-Application Experience Resolver
 * 
 * Supports both:
 * 1. Production Subdomains:
 *    - www.asrtava.com / asrtava.com       => 'public'
 *    - app.asrtava.com                    => 'staff'
 *    - patient.asrtava.com                => 'patient'
 *    - network.asrtava.com                => 'network'
 *    - admin.asrtava.com                  => 'admin'
 * 
 * 2. On-Premises / Localhost Path & Query Routing:
 *    - / or /public                       => 'public'
 *    - /app or /staff or /login/staff      => 'staff'
 *    - /patient or /login/patient         => 'patient'
 *    - /network or /login/coordination    => 'network'
 *    - /admin or /super-admin             => 'admin'
 */

export type AsrtavaApplication = 'public' | 'staff' | 'patient' | 'network' | 'admin';

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
    name: 'ASRTAVA Public Website',
    tagline: 'Enterprise Hospital Management Ecosystem · Sales, Pricing & Demos',
    defaultHost: 'asrtava.com',
    primaryPath: '/',
    themeColor: 'teal',
  },
  staff: {
    app: 'staff',
    name: 'ASRTAVA Hospital Staff Application',
    tagline: 'Operational Workspaces for Doctors, Nurses, Admin, Pharmacy & Labs',
    defaultHost: 'app.asrtava.com',
    primaryPath: '/app',
    themeColor: 'cyan',
  },
  patient: {
    app: 'patient',
    name: 'ASRTAVA Patient Portal',
    tagline: 'Appointments, Health Records, Prescriptions, Reports & Bills',
    defaultHost: 'patient.asrtava.com',
    primaryPath: '/patient',
    themeColor: 'blue',
  },
  network: {
    app: 'network',
    name: 'Healthcare Coordination Network',
    tagline: 'Authorized NOTTO Organ Matching, Emergency Transfers & Bed Matrix',
    defaultHost: 'network.asrtava.com',
    primaryPath: '/network',
    themeColor: 'amber',
  },
  admin: {
    app: 'admin',
    name: 'Platform Administration Console',
    tagline: 'Customer Organizations, Tenants, Perpetual Licenses & Registry',
    defaultHost: 'admin.asrtava.com',
    primaryPath: '/admin',
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

  // 1. Explicit query parameter override (e.g. ?app=network or ?app=admin)
  const appParam = searchParams.get('app')?.toLowerCase();
  if (appParam && appParam in ASRTAVA_APPLICATIONS) {
    return appParam as AsrtavaApplication;
  }

  // 2. Subdomain match (Cloud Multi-Tenant deployment)
  if (hostname.startsWith('app.')) return 'staff';
  if (hostname.startsWith('patient.')) return 'patient';
  if (hostname.startsWith('network.')) return 'network';
  if (hostname.startsWith('admin.') || hostname.startsWith('superadmin.')) return 'admin';

  // 3. Path match (Localhost, On-Premises, Preview environments)
  if (pathname.startsWith('/app') || pathname.startsWith('/staff') || pathname.startsWith('/login/staff')) {
    return 'staff';
  }
  if (pathname.startsWith('/patient') || pathname.startsWith('/login/patient')) {
    return 'patient';
  }
  if (pathname.startsWith('/network') || pathname.startsWith('/coordination') || pathname.startsWith('/login/coordination')) {
    return 'network';
  }
  if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin') || pathname.startsWith('/login/super-admin')) {
    return 'admin';
  }

  // Default to Public Website
  return 'public';
}
