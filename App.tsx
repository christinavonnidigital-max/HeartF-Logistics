
import React, { useState } from 'react';
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

import { mockVehicles, mockMaintenance, mockExpenses } from './data/mockData';
import { mockLeads, mockOpportunities, mockLeadScoringRules, mockSalesReps, mockLeadActivities } from './data/mockCrmData';
import { mockInvoices, mockAllExpenses } from './data/mockFinancialsData';
import { mockRoutes, mockWaypoints } from './data/mockRoutesData';
import { mockBookings } from './data/mockBookingsData';
import { mockCampaigns, mockSalesSequences } from './data/mockMarketingData';


export type View = 'dashboard' | 'fleet' | 'bookings' | 'drivers' | 'customers' | 'routes' | 'reports' | 'leads' | 'campaigns' | 'financials' | 'marketing' | 'settings' | 'analytics';

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');

  const contextData = {
    dashboard: {
      vehicles: mockVehicles,
      leads: mockLeads,
      opportunities: mockOpportunities,
      invoices: mockInvoices,
      bookings: mockBookings,
    },
    fleet: {
      vehicles: mockVehicles,
      maintenance: mockMaintenance,
      expenses: mockExpenses,
    },
    crm: {
      leads: mockLeads,
      opportunities: mockOpportunities,
      leadScoringRules: mockLeadScoringRules,
      salesReps: mockSalesReps,
      leadActivities: mockLeadActivities
    },
    financials: {
        invoices: mockInvoices,
        expenses: mockAllExpenses,
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

  const renderView = () => {
    switch(activeView) {
      case 'dashboard': return <Dashboard />;
      case 'fleet': return <FleetDashboard />;
      case 'crm': return <CrmDashboard />;
      case 'financials': return <FinancialsDashboard />;
      case 'routes': return <RoutesDashboard />;
      case 'bookings': return <BookingsPage />;
      case 'drivers': return <DriversPage />;
      case 'customers': return <CustomersPage />;
      case 'reports': return <ReportsPage />;
      case 'leads': return <CrmDashboard />; // leads is main part of CRM
      case 'campaigns': return <CampaignsPage />;
      case 'marketing': return <MarketingDashboard />;
      default: return <Dashboard />;
    }
  }
  
  const getContext = () => {
    if (activeView === 'leads') return contextData.crm;
    if (['dashboard', 'fleet', 'crm', 'financials', 'routes', 'marketing'].includes(activeView)) {
        return contextData[activeView as keyof typeof contextData];
    }
    return contextData.dashboard; // Default context
  }


  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView}
      contextData={getContext()}
    >
      {renderView()}
    </Layout>
  );
}

export default App;
