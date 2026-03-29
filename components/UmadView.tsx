
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MillingState, WheatType } from '../types_umad';
import { DEFAULT_VALUES } from '../constants_umad';
import { calculateWaterDosage } from '../utils/calculations_umad';
import { getForecastAverage } from '../utils/weatherService_umad';
import { saveUmadState, subscribeToUmadState } from '../firebase';
import ControlPanel from './ControlPanel';
import ProcessFlow from './ProcessFlow';
import ScheduleTable from './ScheduleTable';
import WeatherWidget from './WeatherWidget';
import { Zap, Waves } from 'lucide-react';

interface UmadViewProps {
  onBack: () => void;
}

export const UmadView: React.FC<UmadViewProps> = ({ onBack }) => {
  const [millingState, setMillingState] = useState<MillingState>({
    startTime: DEFAULT_VALUES.START_TIME,
    shiftDuration: DEFAULT_VALUES.SHIFT_DURATION,
    flowRate: DEFAULT_VALUES.FLOW_RATE,
    initialMoisture: DEFAULT_VALUES.INITIAL_MOISTURE,
    wheatType: WheatType.COLA,
    weatherMode: 'MANUAL',
    airTemperature: DEFAULT_VALUES.AIR_TEMP,
    relativeHumidity: DEFAULT_VALUES.AIR_HUMIDITY,
    restTime: DEFAULT_VALUES.REST_TIME,
    targetFlourMoisture: DEFAULT_VALUES.TARGET_FLOUR_MOISTURE,
    manualLossOverride: null,
    hourlyForecast: [] 
  });

  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const isRemoteUpdate = useRef(false);

  // Subscribe to remote changes
  useEffect(() => {
    const unsub = subscribeToUmadState((remoteState) => {
      isRemoteUpdate.current = true;
      setMillingState(prev => ({
        ...prev,
        ...remoteState,
        // Preserve hourly forecast if not provided by remote (it's large and derived)
        hourlyForecast: remoteState.hourlyForecast || prev.hourlyForecast
      }));
      setTimeout(() => { isRemoteUpdate.current = false; }, 100);
    });
    return () => unsub();
  }, []);

  // Save local changes to remote
  useEffect(() => {
    if (!isRemoteUpdate.current) {
      const timer = setTimeout(() => {
        saveUmadState(millingState);
      }, 1000); // Debounce saves
      return () => clearTimeout(timer);
    }
  }, [millingState]);

  useEffect(() => {
    let isMounted = true;
    if (millingState.weatherMode === 'AUTO') {
      const updateFromForecast = async () => {
        setIsLoadingWeather(true);
        try {
          const forecast = await getForecastAverage(millingState.restTime);
          if (isMounted) {
            setMillingState(prev => ({
              ...prev,
              airTemperature: forecast.avgTemp,
              relativeHumidity: forecast.avgHumidity,
              hourlyForecast: forecast.hourlyPoints
            }));
          }
        } catch (error) {
          console.error("Failed to update auto weather", error);
        } finally {
          if (isMounted) setIsLoadingWeather(false);
        }
      };
      updateFromForecast();
    }
    return () => { isMounted = false; };
  }, [millingState.weatherMode, millingState.restTime]);

  const handleStateChange = (key: keyof MillingState, value: any) => {
    setMillingState(prev => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => calculateWaterDosage(millingState), [millingState]);

  return (
    <div className="w-full pb-12 animate-fadeIn font-inter">
      <div className="mb-8 flex items-center justify-between">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Controle de Umidade</h2>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em] mt-2">Sistema UMAD - Moinho Comercial</p>
         </div>
         <div className="flex items-center gap-4">
           <WeatherWidget />
           <button onClick={onBack} className="p-3 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          <ControlPanel state={millingState} onChange={handleStateChange} isLoadingWeather={isLoadingWeather} />
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-8">Fluxo de Processo</h3>
            <ProcessFlow 
              initialMoisture={millingState.initialMoisture}
              targetTempering={results.targetTemperingMoisture}
              compensatedTarget={results.compensatedDampeningMoisture}
              targetFlour={millingState.targetFlourMoisture}
              loss={results.estimatedLoss}
              storageLoss={results.storageLoss}
            />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {/* Card Dosagem */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-800 relative overflow-hidden group">
              <div className="relative z-10 flex items-center justify-between">
                 <div>
                    <div className="flex items-center gap-2 mb-4">
                       <Zap className="w-5 h-5 text-blue-400 fill-blue-400" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dosagem de Água</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-6xl font-black text-white tabular-nums tracking-tighter">{results.litersPerHour}</span>
                       <span className="text-2xl font-bold text-blue-500">L/h</span>
                    </div>
                 </div>
                 <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Ratio</span>
                    <span className="text-3xl font-black text-white tracking-tight">{results.waterPerTon}</span>
                    <span className="block text-[10px] text-blue-400/60 font-bold uppercase tracking-widest mt-1">L/Ton</span>
                 </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-blue-500/10">
                 <div className="h-full bg-blue-500 animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Card Setpoint */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                     <Waves className="w-5 h-5 text-emerald-500" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setpoint B1</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                     <span className="text-6xl font-black text-slate-800 tabular-nums tracking-tighter">{results.compensatedDampeningMoisture.toFixed(2)}</span>
                     <span className="text-2xl font-bold text-slate-400">%</span>
                  </div>
                </div>
                <div className="bg-emerald-50 px-5 py-4 rounded-3xl border border-emerald-100 text-center">
                   <span className="text-[10px] font-black text-emerald-600 uppercase block mb-1 tracking-widest">Farinha Meta</span>
                   <span className="text-2xl font-black text-emerald-700">{millingState.targetFlourMoisture.toFixed(1)}%</span>
                </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-8 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Cronograma de Repouso</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Horários de entrada e saída</p>
             </div>
             <ScheduleTable schedule={results.schedule} date={new Date().toLocaleDateString('pt-BR')} />
          </div>
        </div>
      </div>
    </div>
  );
};
