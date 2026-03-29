
export enum WheatType {
  COMUM = 'COMUM',
  ESPECIAL = 'ESPECIAL',
  INTEIRA = 'INTEIRA',
  COLA = 'COLA'
}

export type WeatherMode = 'MANUAL' | 'AUTO';

export interface HourlyForecast {
  time: string;
  temp: number;
  humidity: number;
}

export interface MillingState {
  startTime: string;
  shiftDuration: number;
  flowRate: number;
  initialMoisture: number;
  wheatType: WheatType;
  weatherMode: WeatherMode; 
  airTemperature: number;
  relativeHumidity: number;
  hourlyForecast?: HourlyForecast[];
  restTime: number;
  targetFlourMoisture: number;
  manualLossOverride: number | null;
}

export interface CalculationResultUmad {
  estimatedLoss: number;
  targetTemperingMoisture: number;
  compensatedDampeningMoisture: number;
  litersPerHour: number;
  waterPerTon: number;
  storageLoss: number;
  projectedFlourMoisture: number;
  schedule: RestScheduleItem[];
}

export interface RestScheduleItem {
  hourOffset: number;
  timeLabel: string;
  temp: number;
  humidity: number;
  source: 'AUTO' | 'MANUAL';
}
