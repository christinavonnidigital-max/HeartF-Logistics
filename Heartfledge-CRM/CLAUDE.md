# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Heartfledge Logistics Manager is a comprehensive logistics management application built with React, TypeScript, and Vite. The application integrates with Google's Gemini AI for intelligent assistance across different business domains (fleet, CRM, financials, routes).

Originally created in Google AI Studio: https://ai.studio/apps/drive/1FR7MK0hWaKyC1XlXoI1bNg9hyXOZV0dT

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Set the Gemini API key in `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

The API key is exposed to the app via Vite's environment variable system as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` (see `vite.config.ts`).

## Architecture

### State Management

The app uses React Context for global state management with two primary contexts:

1. **AuthContext** (`auth/AuthContext.tsx`):
   - Handles authentication with role-based access control
   - Supports roles: `admin`, `dispatcher`, `ops_manager`, `finance`, `customer`
   - Implements 30-minute auto-logout on inactivity
   - Demo users with hardcoded credentials (not for production use)
   - Persists auth state to localStorage

2. **DataContext** (`contexts/DataContext.tsx`):
   - Central source of truth for application data
   - Manages: vehicles, bookings, leads, opportunities, invoices, expenses, drivers, customers, users
   - Persists all data to localStorage under key `hf_global_data_v1`
   - Initialized with mock data from `data/` directory
   - Provides CRUD operations via context methods

### View-Based Architecture

The app is structured around different business views, controlled by the `View` type in `App.tsx`:

- `dashboard`: Overview with role-based data filtering
- `fleet`: Vehicle management
- `bookings`: Job scheduling
- `drivers`: Driver management
- `customers`: Customer relationship management
- `routes`: Route planning
- `leads`: CRM pipeline
- `campaigns`: Email sequences
- `financials`: Invoicing and expenses
- `reports`: Data export and analytics
- `marketing`: Campaign management
- `settings`: App configuration

Each view has permission restrictions defined in `App.tsx` (`viewPermissions`). Customer role has highly filtered data access for security.

### AI Integration

The `services/geminiService.ts` module provides intelligent routing to different Gemini models:

- **gemini-2.5-pro** (with thinking): Complex analysis, optimization, forecasting
- **gemini-2.5-flash**: General queries, with optional Google Maps or Google Search tools
- **gemini-flash-lite-latest**: Fast/quick queries

The service automatically selects the appropriate model based on prompt keywords and injects domain-specific system instructions and context data (fleet, CRM, financials, routes).

### Component Organization

Components are organized by functionality:

- **Main views**: `Dashboard.tsx`, `FleetDashboard.tsx`, `CrmDashboard.tsx`, `FinancialsDashboard.tsx`, `RoutesDashboard.tsx`, `MarketingDashboard.tsx`
- **Modals**: `Add*Modal.tsx`, `*DetailsModal.tsx` (modal dialogs for CRUD operations)
- **Campaign builder**: Multi-step campaign creation in `components/campaignBuilder/`
- **Shared UI**: `UiKit.tsx`, `EmptyState.tsx`, `icons/Icons.tsx`
- **Layout**: `Layout.tsx` (handles sidebar, header, AI assistant integration)

### Type System

All domain types are centralized in `types.ts` (1300+ lines). This includes:

- User & authentication types
- Customer & loyalty types
- Fleet & vehicle types (vehicles, maintenance, expenses, documents)
- Driver & assignment types
- Booking & delivery types
- CRM types (leads, opportunities, activities, scoring rules)
- Campaign & email sequence types
- Financial types (invoices, payments, expenses, revenue)
- Route & waypoint types
- Weather & tracking types

When adding new features, always check `types.ts` first - the type likely already exists.

### Path Aliases

TypeScript is configured with path alias `@/*` pointing to the project root (see `tsconfig.json`):

```typescript
import { Vehicle } from '@/types';
import { useData } from '@/contexts/DataContext';
```

### Data Persistence

All user data persists to `localStorage`:
- Auth state: `hf_current_user`
- App data: `hf_global_data_v1`
- Settings: `hf_app_settings`

To reset data, use `DataContext.resetData()` which clears storage and reloads.

## Key Patterns

### Role-Based Security

When adding features that access sensitive data:

1. Check user role in component: `const { user } = useAuth()`
2. Filter data based on role (see `getDashboardData()` in `App.tsx` for customer filtering example)
3. Restrict navigation via `viewPermissions` in `App.tsx`
4. Redirect unauthorized users to dashboard

### Adding New Views

1. Add view name to `View` type in `App.tsx`
2. Create component in `components/`
3. Add permission rules to `viewPermissions`
4. Add to `renderView()` switch statement
5. Update `viewTitles` and `viewSubtitles` in `Layout.tsx`
6. Add navigation item in `Sidebar.tsx`

### AI Assistant Integration

The `FleetAssistant` component (used in `Layout.tsx`) can be provided with different context data based on the active view. To add AI support for a new domain:

1. Add context type to `ContextType` in `geminiService.ts`
2. Define system instruction constant
3. Add case to `getSystemInstruction()`
4. Update `getContext()` in `App.tsx` to provide relevant data

### Mock Data Structure

Mock data in `data/` directory follows consistent patterns:
- Each file exports typed arrays matching `types.ts` interfaces
- IDs are consistent across related entities (e.g., `customer_id` links to customers)
- Dates use ISO strings
- All mock data is loaded into `DataContext` on app init

## Common Development Tasks

### Adding a New Entity Type

1. Define types in `types.ts` (interface, enums)
2. Create mock data file in `data/mockXxxData.ts`
3. Add to `DataContext` state and provide CRUD methods
4. Create UI components (list view, details modal, add/edit modal)
5. Wire up to appropriate dashboard view

### Integrating New Gemini Features

The Gemini service supports:
- Dynamic model selection based on prompt analysis
- Google Search and Google Maps tools
- Location context for maps queries
- Custom system instructions per domain
- Chat history for conversational context

When calling `getGeminiResponse()`, provide:
- Current prompt
- Chat history array
- Relevant context data (vehicles, leads, etc.)
- Context type ('fleet' | 'crm' | 'financials' | 'routes')
- Optional location for maps queries

### Styling

The app uses inline Tailwind-style utility classes (not actual Tailwind). The `UiKit.tsx` file provides reusable styled components following the design system.

## Known Limitations

- Authentication is demo-only with hardcoded users (not production-ready)
- No backend - all data is client-side in localStorage
- Secondary data (routes, waypoints, some activities) still use static mocks
- No real-time updates or collaboration features
- Vehicle expenses are separate from global expenses (partial integration)
