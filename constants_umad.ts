
import { WheatType } from './types_umad';

export const WHEAT_FACTOR: Record<WheatType, number> = {
  [WheatType.COMUM]: 1.00,
  [WheatType.ESPECIAL]: 1.02,
  [WheatType.INTEIRA]: 1.03,
  [WheatType.COLA]: 1.05
};

export const DEFAULT_VALUES = {
  FLOW_RATE: 6500,
  INITIAL_MOISTURE: 11.0,
  TARGET_FLOUR_MOISTURE: 14.5,
  AIR_TEMP: 25,
  AIR_HUMIDITY: 60,
  START_TIME: "06:00",
  SHIFT_DURATION: 8,
  REST_TIME: 24
};
