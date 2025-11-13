
import { Vehicle, VehicleMaintenance, VehicleExpense, VehicleType, VehicleStatus, MaintenanceType, MaintenanceStatus, ExpenseType, Currency } from '../types';

export const mockVehicles: Vehicle[] = [
  {
    id: 1,
    registration_number: 'AEZ 1234',
    make: 'DAF',
    model: 'XF 530',
    year: 2021,
    vehicle_type: VehicleType.DRY,
    capacity_tonnes: 34,
    status: VehicleStatus.ACTIVE,
    current_km: 150000,
    last_service_date: '2024-05-10',
    next_service_due_km: 160000,
    gps_device_id: 'GPS-001A',
  },
  {
    id: 2,
    registration_number: 'AFD 5678',
    make: 'Mercedes',
    model: 'Actros 2651',
    year: 2022,
    vehicle_type: VehicleType.REFRIGERATED,
    capacity_tonnes: 30,
    status: VehicleStatus.ACTIVE,
    current_km: 85000,
    last_service_date: '2024-06-01',
    next_service_due_km: 95000,
    gps_device_id: 'GPS-002B',
  },
  {
    id: 3,
    registration_number: 'ACY 9876',
    make: 'Hino',
    model: '700',
    year: 2019,
    vehicle_type: VehicleType.FLATBED,
    capacity_tonnes: 25,
    status: VehicleStatus.MAINTENANCE,
    current_km: 210000,
    last_service_date: '2024-04-15',
    next_service_due_km: 220000,
    gps_device_id: 'GPS-003C',
  },
   {
    id: 4,
    registration_number: 'AFG 1122',
    make: 'DAF',
    model: 'CF 480',
    year: 2020,
    vehicle_type: VehicleType.DRY,
    capacity_tonnes: 32,
    status: VehicleStatus.ACTIVE,
    current_km: 180500,
    last_service_date: '2024-07-02',
    next_service_due_km: 190000,
    gps_device_id: 'GPS-004D',
  },
];

export const mockMaintenance: VehicleMaintenance[] = [
  { id: 1, vehicle_id: 1, maintenance_type: MaintenanceType.ROUTINE, description: 'Engine oil and filter change', cost: 350, service_date: '2024-05-10', status: MaintenanceStatus.COMPLETED },
  { id: 2, vehicle_id: 2, maintenance_type: MaintenanceType.ROUTINE, description: 'Brake inspection and fluid top-up', cost: 200, service_date: '2024-06-01', status: MaintenanceStatus.COMPLETED },
  { id: 3, vehicle_id: 3, maintenance_type: MaintenanceType.REPAIR, description: 'Transmission fluid leak repair', cost: 1200, service_date: '2024-07-20', status: MaintenanceStatus.IN_PROGRESS },
  { id: 4, vehicle_id: 1, maintenance_type: MaintenanceType.INSPECTION, description: 'Quarterly safety inspection', cost: 150, service_date: '2024-02-15', status: MaintenanceStatus.COMPLETED },
];

export const mockExpenses: VehicleExpense[] = [
  { id: 1, vehicle_id: 1, expense_type: ExpenseType.FUEL, amount: 500, currency: Currency.USD, description: 'Diesel fill-up', expense_date: '2024-07-15' },
  { id: 2, vehicle_id: 2, expense_type: ExpenseType.FUEL, amount: 450, currency: Currency.USD, description: 'Diesel fill-up', expense_date: '2024-07-16' },
  { id: 3, vehicle_id: 3, expense_type: ExpenseType.MAINTENANCE, amount: 1200, currency: Currency.USD, description: 'Transmission repair payment', expense_date: '2024-07-20' },
  { id: 4, vehicle_id: 1, expense_type: ExpenseType.TOLLS, amount: 50, currency: Currency.ZIG, description: 'Highway tolls', expense_date: '2024-07-18' },
];
