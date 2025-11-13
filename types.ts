
export enum VehicleType {
  REFRIGERATED = 'refrigerated',
  DRY = 'dry',
  FLATBED = 'flatbed',
}

export enum VehicleStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum MaintenanceType {
  ROUTINE = 'routine',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  EMERGENCY = 'emergency',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ExpenseType {
  FUEL = 'fuel',
  MAINTENANCE = 'maintenance',
  INSURANCE = 'insurance',
  LICENSE = 'license',
  TOLLS = 'tolls',
  PARKING = 'parking',
  OTHER = 'other',
}

export enum Currency {
    USD = 'USD',
    ZWL = 'ZWL',
    ZIG = 'ZIG',
}

export interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: VehicleType;
  capacity_tonnes: number;
  status: VehicleStatus;
  current_km: number;
  last_service_date: string;
  next_service_due_km: number;
  gps_device_id: string;
}

export interface VehicleMaintenance {
  id: number;
  vehicle_id: number;
  maintenance_type: MaintenanceType;
  description: string;
  cost: number;
  service_date: string;
  status: MaintenanceStatus;
  next_service_date?: string;
}

export interface VehicleExpense {
  id: number;
  vehicle_id: number;
  expense_type: ExpenseType;
  amount: number;
  currency: Currency;
  description: string;
  expense_date: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets: {
            uri: string;
            review: string;
        }[];
    }[]
  };
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  groundingChunks?: GroundingChunk[];
}
