
// CalculationResult interface
export interface CalculationResult {
  flourPerHour: number;
  branPerHour: number;
  totalPerHour: number;
  yieldPercentage: number;
  breakdown: {
    common: number;
    special: number;
    whole: number;
    glue: number;
  }
}

// LoadType and Load interface
export type LoadType = 'E' | 'C' | 'I' | 'CL';

export interface Load {
  id: string;
  loadId: string; // Ex: EQI14
  type: LoadType;
  quantity: number; // Target quantity
  currentQty: number; // Current bag count
  client?: string;
  weight?: number;
  step: number; // 1 a 7
  status: 'ATIVO' | 'FINALIZADO';
  createdAt: any;
  updatedAt: any;
  userId: string;
  batchId?: string;
  batchName?: string;
  driverName?: string;
  vehiclePlate?: string;
}

// Added missing StockData interface
export interface StockData {
  common: number;
  special: number;
  whole: number;
  glue: number;
  branStock: number; // In kg
  updatedAt?: any;
  userId?: string;
}

// Added missing Destination type
export type Destination = 'C' | 'E' | 'CL';

// Added missing Bica interface
export interface Bica {
  id: string;
  name: string;
  color: number;
  vazao: number;
  destination: Destination | null;
}

// Added missing SavedExtraction interface
export interface SavedExtraction {
  id: string;
  date: any;
  flour: number;
  bran: number;
  yieldPercentage: number;
  flourCommon?: number;
  flourSpecial?: number;
  flourWhole?: number;
  flourGlue?: number;
  userId: string;
}

// Added missing MoistureEntry interface
export interface MoistureEntry {
  id: string;
  wheat: number;
  flour: number;
  bran: number;
  date: any;
  userId: string;
}

export interface Analysis {
  id: string;
  colors: {
    special: string;
    common: string;
    whole: string;
    glue: string;
  };
  humidities: {
    special: number;
    common: number;
    whole: number;
    glue: number;
  };
  date: any;
  userId: string;
}

// Added missing MillingBoxDetails interface
export interface MillingBoxDetails {
  date: string;
  startHour: string;
  flowRate: number;
  wheatType: string;
  scale: number;
  water: number;
  molhagemStart: string;
  totalKg: number;
  operator: string;
}

// Added missing MillingBoxData interface
export interface MillingBoxData {
  id: number;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  startTime: number | null; 
  elapsedTime: number; 
  details: MillingBoxDetails;
}

export interface CalculatorState {
  flourCommon: string;
  flourSpecial: string;
  flourWhole: string;
  flourGlue: string;
  branSample: string;
  step: 'form' | 'results';
  results: CalculationResult | null;
  updatedAt?: any;
}

export interface AppConfig {
  currentView: string;
  updatedAt?: any;
}

export interface Batch {
  id: string;
  name: string;
  targetWheat: number;
  currentWheat: number;
  targetFlour: number;
  currentFlour: number;
  targetSubproduct: number;
  currentSubproduct: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: any;
  closedAt?: any;
  // Summary fields for report
  totalBags?: number;
  wheatEntryCount?: number;
  flourLoadCount?: number;
  subproductLoadCount?: number;
  durationDays?: number;
  millingCapacity: number; // kg/h
}

export interface WheatEntry {
  id: string;
  ticket: string;
  driver: string;
  plate: string;
  description: string;
  entity: string;
  product: string;
  batchId?: string;
  entryWeight: number;
  exitWeight: number;
  liquidWeight: number;
  moisture: number;
  impurity: number;
  trigulhao: number;
  avariado: number;
  ph: number;
  discount: number;
  finalWeight: number;
  date: any;
  entryTime?: string;
  userId: string;
}

export type SubproductType = 'FARELO' | 'RESIDUO' | 'OUTRO';

export interface SubproductLoad {
  id: string;
  loadId: string;
  type: SubproductType;
  otherName?: string;
  quantity: number;
  status: 'ATIVO' | 'FINALIZADO';
  createdAt: any;
  updatedAt: any;
  userId: string;
  batchId?: string;
  driverName?: string;
  vehiclePlate?: string;
  client?: string;
}
