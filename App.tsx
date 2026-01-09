
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import FleetDashboard from './components/FleetDashboard';
import CrmDashboard from './components/CrmDashboard';
import FinancialsDashboard from './components/FinancialsDashboard';
import RoutesDashboard from './components/RoutesDashboard';
import Dashboard from './components/Dashboard';
import BookingsPage from './components/BookingsPage';
import DriversPage from './components/DriversPage';
import CustomersPage from './components/CustomersPage';
import ReportsPage from './components/ReportsPage';
import MarketingDashboard from './components/MarketingDashboard';
import CampaignsPage from './components/CampaignsPage';
import NewCampaignPage from './components/NewCampaignPage';
import CampaignAnalyticsPage from './components/CampaignAnalyticsPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import { AuthProvider, useAuth, UserRole } from './auth/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import AcceptInvitePage from './components/AcceptInvitePage';
import LeadFinderPage from './components/LeadFinderPage';

// Static mocks still needed for some secondary data like routes/waypoints/activities which we aren't putting in global state yet
import { mockLeadScoringRules, mockSalesReps } from './data/mockCrmData';
import { mockRoutes, mockWaypoints } from './data/mockRoutesData';
import { mockCampaigns, mockSalesSequences } from './data/mockMarketingData';
import { mockDriverAssignments, mockUsersForDrivers } from './data/mockDriversData';
import { mockExpenses } from './data/mockData';


export type View = 'dashboard' | 'fleet' | 'bookings' | 'drivers' | 'customers' | 'routes' | 'reports' | 'leads' | 'lead-finder' | 'campaigns' | 'new-campaign' | 'financials' | 'marketing' | 'settings' | 'analytics';

export type AppSettings = {
  defaultView: View;
  enableAssistant: boolean;
  distanceUnit: 'km' | 'mi';
  currency: 'USD' | 'ZWL';
  showFinancialSummary: boolean;
  serviceDueSoonKm: number;
  invoiceReminderDays: number;
  proofMaxMb: number;
};

const DEFAULT_SETTINGS: AppSettings = {
  defaultView: 'dashboard',
  enableAssistant: true,
  distanceUnit: 'km',
  currency: 'USD',
  showFinancialSummary: true,
  serviceDueSoonKm: 1000,
  invoiceReminderDays: 5,
  proofMaxMb: 5,
};

const SETTINGS_STORAGE_KEY = 'hf_app_settings';

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const AuthedApp: React.FC = () => {
  const { user, loading } = useAuth();
  const {
    vehicles,
    bookings,
    leads,
    opportunities,
    invoices,
    expenses,
    drivers,
    maintenance,
    leadActivities,
    opportunityActivities,
    deliveryProofs,
  } = useData(); // Consuming global data
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [activeView, setActiveView] = useState<View>(() => settings.defaultView);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  // Define view permissions
  const viewPermissions: Partial<Record<View, UserRole[]>> = {
    fleet: ['admin', 'dispatcher', 'ops_manager'],
    bookings: ['admin', 'dispatcher', 'ops_manager', 'customer'],
    drivers: ['admin', 'dispatcher', 'ops_manager'],
    routes: ['admin', 'dispatcher', 'ops_manager'],
    leads: ['admin', 'ops_manager', 'dispatcher'],
    "lead-finder": ['admin', 'ops_manager', 'dispatcher'],
    marketing: ['admin', 'ops_manager'],
    campaigns: ['admin', 'ops_manager'],
    "new-campaign": ['admin', 'ops_manager'],
    analytics: ['admin', 'ops_manager'],
    financials: ['admin', 'finance', 'ops_manager', 'customer'],
    reports: ['admin', 'finance', 'ops_manager'],
    settings: ['admin', 'ops_manager', 'finance'],
  };

  // Integrate axe-core in development to catch accessibility regressions early
  // This runs only in dev and avoids bundling in production
  if ((import.meta as any).env?.DEV && typeof window !== 'undefined') {
    (async () => {
      try {
        const axe = await import('axe-core');
        // Run a single pass and log violations to console in development
        // eslint-disable-next-line no-console
        axe.run(document, {}, (err: any, results: any) => {
          if (err) {
            // eslint-disable-next-line no-console
            console.warn('axe error:', err);
            return;
          }
          if (results.violations && results.violations.length) {
            // eslint-disable-next-line no-console
            console.groupCollapsed('Axe accessibility violations (development)');
            // eslint-disable-next-line no-console
            console.table(results.violations.map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }))); 
            results.violations.forEach((v: any) => {
              // eslint-disable-next-line no-console
              console.log(v);
            });
            // Expose violations to window for E2E test capture
            try {
              (window as any).__axeViolations__ = results.violations;
            } catch (e) {
              // ignore
            }
            // eslint-disable-next-line no-console
            console.groupEnd();
          } else {
            // eslint-disable-next-line no-console
            console.info('Axe: no accessibility violations detected (dev run)');
          }
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('axe-core failed to run:', err);
      }
    })();
  }

  // Redirect to dashboard if user logs in or permissions change/fail
  useEffect(() => {
    if (user) {
        const allowedRoles = viewPermissions[activeView];
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            setActiveView('dashboard');
        }
    }
  }, [user, activeView]);

  if (loading) {
      return null; 
  }

  if (!user) {
    return <LoginPage />;
  }

  // Construct context data for views and AI, mixing Global State with static/secondary mocks
  const contextData = {
    dashboard: {
      vehicles,
      leads,
      opportunities,
      invoices,
      bookings,
    },
    fleet: {
      vehicles,
      maintenance,
      expenses: mockExpenses, // Vehicle expenses still static for now, main expenses are global
    },
    drivers: {
      drivers,
      assignments: mockDriverAssignments,
      users: mockUsersForDrivers,
    },
    crm: {
      leads,
      opportunities,
      leadScoringRules: mockLeadScoringRules,
      salesReps: mockSalesReps,
      leadActivities,
      opportunityActivities,
      deliveryProofs,
    },
    financials: {
        invoices,
        expenses,
    },
    routes: {
      routes: mockRoutes,
      waypoints: mockWaypoints,
    },
    marketing: {
      campaigns: mockCampaigns,
      sequences: mockSalesSequences
    }
  };

  // Secure Data Filtering for Dashboard
  const getDashboardData = () => {
    if (user.role === 'customer') {
      const customerId = Number(user.userId);
      return {
        vehicles: [], // Customers don't see fleet details
        leads: [], // Customers don't see sales leads
        opportunities: opportunities.filter(o => o.customer_id === customerId),
        invoices: invoices.filter(i => i.customer_id === customerId),
        bookings: bookings.filter(b => b.customer_id === customerId),
      };
    }
    return contextData.dashboard;
  };

  const renderView = () => {
    // Extra safety check during render
    const allowedRoles = viewPermissions[activeView];
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Dashboard data={getDashboardData()} settings={settings} userRole={user.role} />;
    }

    switch(activeView) {
      case 'dashboard': return <Dashboard data={getDashboardData()} settings={settings} userRole={user.role} />;
      case 'fleet': return <FleetDashboard settings={settings} />;
      case 'financials': return <FinancialsDashboard settings={settings} />;
      case 'routes': return <RoutesDashboard />;
      case 'bookings': return <BookingsPage settings={settings} />;
      case 'drivers': return <DriversPage data={contextData.drivers} />;
      case 'customers': return <CustomersPage />;
      case 'reports': return <ReportsPage data={contextData} />;
      case 'leads': return <CrmDashboard />; // leads is main part of CRM
      case 'lead-finder': return <LeadFinderPage />;
      case 'campaigns': return <CampaignsPage setActiveView={setActiveView} />;
      case 'new-campaign': return <NewCampaignPage setActiveView={setActiveView} />;
      case 'marketing': return <MarketingDashboard />;
      case 'analytics': return <CampaignAnalyticsPage />;
      case 'settings': return <SettingsPage settings={settings} onChangeSettings={setSettings} />;
      default: return <Dashboard data={getDashboardData()} settings={settings} userRole={user.role} />;
    }
  }
  
  const getContext = () => {
    if (activeView === 'leads') return contextData.crm;
    if (['dashboard', 'fleet', 'crm', 'financials', 'routes', 'marketing', 'new-campaign', 'analytics', 'drivers'].includes(activeView)) {
        return contextData[activeView as keyof typeof contextData] || contextData.marketing;
    }
    return contextData.dashboard; // Default context
  }

  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView}
      contextData={getContext()}
      settings={settings}
    >
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <DataProvider>
        {typeof window !== 'undefined' && window.location.pathname.startsWith('/accept-invite') ? (
          <AcceptInvitePage />
        ) : (
          <AuthedApp />
        )}
    </DataProvider>
  </AuthProvider>
);

export default App;
