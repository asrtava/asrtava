import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

export type PortalType =
  | 'super-admin'
  | 'group-admin'
  | 'hospital-admin'
  | 'doctor'
  | 'nursing'
  | 'reception'
  | 'laboratory'
  | 'radiology'
  | 'pharmacy'
  | 'finance'
  | 'hr'
  | 'inventory'
  | 'ot'
  | 'emergency'
  | 'patient';

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  hospitalId: string | null;
  hospitalName?: string;
  userType: string;
  assignedRoles: string[];
  authorizedPortals: PortalType[];
}

export interface PermissionItem {
  module: string;
  action: string;
  resource: string;
}

interface AuthContextType {
  user: UserSession | null;
  activePortal: PortalType;
  activePortalTab: string;
  setActivePortalTab: (tab: string) => void;
  currentAuthView: string | null;
  setCurrentAuthView: (view: string | null) => void;
  setActivePortal: (portal: PortalType) => void;
  switchWorkspace: (targetPortal: PortalType) => Promise<void>;
  hasPermission: (action: string, resource: string) => boolean;
  login: (data: { user: UserSession; token: string; refreshToken?: string }) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const getDefaultTabForPortal = (portal: PortalType): string => {
  switch (portal) {
    case 'super-admin': return 'tenants';
    case 'group-admin': return 'overview';
    case 'hospital-admin': return 'overview';
    case 'doctor': return 'opd';
    case 'nursing': return 'beds';
    case 'reception': return 'queue';
    case 'pharmacy': return 'queue';
    case 'laboratory': return 'advanced-hub';
    case 'radiology': return 'worklist';
    case 'finance': return 'invoices';
    case 'hr': return 'advanced_hrms';
    case 'inventory': return 'advanced_procurement';
    case 'ot': return 'theatres';
    case 'emergency': return 'triage_board';
    case 'patient': return 'overview';
    default: return 'overview';
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('asrtava_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activePortal, setActivePortal] = useState<PortalType>('hospital-admin');
  const [activePortalTab, setActivePortalTab] = useState<string>(() => getDefaultTabForPortal('hospital-admin'));
  const [currentAuthView, setCurrentAuthView] = useState<string | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<PermissionItem[]>([]);

  // Keep activePortalTab in sync when activePortal changes
  useEffect(() => {
    setActivePortalTab(getDefaultTabForPortal(activePortal));
  }, [activePortal]);

  const login = (data: { user: UserSession; token: string; refreshToken?: string }) => {
    setUser(data.user);
    localStorage.setItem('asrtava_user', JSON.stringify(data.user));
    localStorage.setItem('asrtava_token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('asrtava_refresh_token', data.refreshToken);
    }
    setCurrentAuthView(null);
    if (data.user.authorizedPortals.length > 0) {
      setActivePortal(data.user.authorizedPortals[0]);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem('asrtava_user');
      localStorage.removeItem('asrtava_token');
      localStorage.removeItem('asrtava_refresh_token');
      setCurrentAuthView(null);
    }
  };

  const switchWorkspace = async (targetPortal: PortalType) => {
    if (!user) return;
    try {
      if (user.hospitalId) {
        const res = await authApi.switchWorkspace({
          hospitalId: user.hospitalId,
          targetPortal,
        });
        if (res.data?.data?.accessToken) {
          localStorage.setItem('asrtava_token', res.data.data.accessToken);
        }
      }
    } catch (e) {
      console.warn('Switch workspace server call failed; proceeding with local context');
    }
    setActivePortal(targetPortal);
  };

  const hasPermission = (action: string, resource: string): boolean => {
    if (!user) return false;
    if (user.userType === 'super_admin') return true;
    if (user.assignedRoles.includes('hospital_admin') || user.assignedRoles.includes('hospital_owner')) return true;

    // Check effective permissions list if loaded
    if (effectivePermissions.length > 0) {
      return effectivePermissions.some(
        (p) => p.action === action && (p.resource === resource || p.resource === 'all')
      );
    }
    return true; // permissive fallback in development
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activePortal,
        activePortalTab,
        setActivePortalTab,
        currentAuthView,
        setCurrentAuthView,
        setActivePortal,
        switchWorkspace,
        hasPermission,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
