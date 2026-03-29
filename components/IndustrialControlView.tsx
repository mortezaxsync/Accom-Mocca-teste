
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Wheat, 
  Package, 
  ArrowRightLeft,
  Scale,
  RefreshCw,
  Clock,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getActiveBatch, saveProductionEntry } from '../firebase';
import { Batch } from '../types';
import { Toast, ToastType } from './Toast';

interface IndustrialControlViewProps {
  onBack: () => void;
}

export const IndustrialControlView: React.FC<IndustrialControlViewProps> = ({ onBack }) => {
  const { wheatEntries, loads, subproductLoads, batches: allBatches, loadingBatches } = useData();
  const activeBatches = allBatches.filter(b => b.status === 'OPEN');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  useEffect(() => {
    if (activeBatches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(activeBatches[0].id);
    }
  }, [activeBatches, selectedBatchId]);

  useEffect(() => {
    if (selectedBatchId) {
      const batch = activeBatches.find(b => b.id === selectedBatchId);
      if (batch) {
        setActiveBatch(batch);
      } else if (activeBatches.length > 0) {
        setSelectedBatchId(activeBatches[0].id);
      } else {
        setActiveBatch(null);
      }
    } else if (activeBatches.length > 0) {
      setSelectedBatchId(activeBatches[0].id);
    }
  }, [selectedBatchId, activeBatches]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  // Calculations - STRICTLY FOR ACTIVE BATCH
  const batchWheatEntries = activeBatch 
    ? wheatEntries.filter(e => e.batchId === activeBatch.id)
    : [];
  
  const totalWheat = batchWheatEntries.reduce((acc, curr) => acc + curr.finalWeight, 0);
  
  const batchFlourLoads = activeBatch
    ? loads.filter(l => l.batchId === activeBatch.id && (l.status === 'FINALIZADO' || l.step >= 6))
    : [];

  const totalFlour = batchFlourLoads.reduce((acc, curr) => acc + (curr.weight || 0), 0);

  // Bag counts for active batch
  const commonBags = batchFlourLoads.filter(l => l.type === 'C').reduce((acc, curr) => acc + (curr.currentQty || 0), 0);
  const specialBags = batchFlourLoads.filter(l => l.type === 'E').reduce((acc, curr) => acc + (curr.currentQty || 0), 0);
  const wholeBags = batchFlourLoads.filter(l => l.type === 'I').reduce((acc, curr) => acc + (curr.currentQty || 0), 0);

  const batchSubproductLoads = activeBatch
    ? subproductLoads.filter(l => l.batchId === activeBatch.id && l.status === 'FINALIZADO')
    : [];

  const totalBran = batchSubproductLoads.filter(l => l.type === 'FARELO').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalResidue = batchSubproductLoads.filter(l => l.type === 'RESIDUO').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalOtherSub = batchSubproductLoads.filter(l => l.type === 'OUTRO').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalSubproducts = totalBran + totalResidue + totalOtherSub;

  const totalOutput = totalFlour + totalSubproducts;
  const massBalance = totalWheat - totalOutput;
  const massBalancePercent = totalWheat > 0 ? (massBalance / totalWheat) * 100 : 0;
  
  const extractionRate = totalWheat > 0 ? (totalFlour / totalWheat) * 100 : 0;

  // Expected vs Real (based on processed wheat)
  const expectedFlour = totalWheat * 0.77;
  const expectedSubproducts = totalWheat * 0.23;
  const flourDiff = totalFlour - expectedFlour;
  const subDiff = totalSubproducts - expectedSubproducts;

  // Predictions & Logistics
  const avgLoadWeight = 17250; // 17.25 tons average as requested by user
  const missingWheatKg = activeBatch ? Math.max(0, activeBatch.targetWheat - totalWheat) : 0;
  const missingFlourKg = activeBatch ? Math.max(0, activeBatch.targetFlour - totalFlour) : 0;
  const loadsArrived = batchWheatEntries.length;
  // User requested estimation based on 17250kg average for missing loads
  const loadsMissing = Math.ceil(missingWheatKg / avgLoadWeight);
  const loadsNeededTotal = loadsArrived + loadsMissing;

  // Time Estimation: Capacity from active batch
  const capacity = activeBatch?.millingCapacity || 2500;
  // We calculate based on wheat that still needs to be milled to reach the target flour
  const remainingWheatToMill = activeBatch ? Math.max(0, activeBatch.targetWheat - (totalFlour / 0.77)) : 0;
  const hoursRemaining = remainingWheatToMill / capacity;
  const daysRemaining = hoursRemaining / 24;

  // Industrial Loss Limit (1%)
  const isLossAcceptable = massBalancePercent <= 1 && massBalancePercent >= -1;

  return (
    <div className="w-full px-4 pb-12 animate-fadeIn font-inter flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4 sticky top-0 bg-slate-50 z-10 pb-2">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2.5 mr-3 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">Painel de Controle Industrial</h2>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Balanço Exclusivo do Lote em Vigor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <RefreshCw size={14} className="text-blue-600" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Tempo Real</span>
        </div>
      </div>

      {/* Seleção de Lote Ativo */}
      {loadingBatches ? (
        <div className="mb-6 flex items-center gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
          <RefreshCw size={12} className="text-blue-600 animate-spin" />
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Carregando lotes...</span>
        </div>
      ) : activeBatches.length > 1 && (
        <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Visualizar Lote:</span>
          {activeBatches.map(batch => (
            <button
              key={batch.id}
              onClick={() => setSelectedBatchId(batch.id)}
              className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                selectedBatchId === batch.id 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
              }`}
            >
              {batch.name}
            </button>
          ))}
        </div>
      )}

      {!activeBatch ? (
        <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <AlertCircle size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nenhum Lote Ativo</h3>
          <p className="text-slate-400 text-sm font-medium mt-2">Inicie um novo lote no Sistema de Pedido para ver as análises.</p>
        </div>
      ) : (
        <>
          {/* Active Batch Overview */}
          <div className="mb-8 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <TrendingUp size={120} />
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-900/20">
                  <BarChart3 size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Lote em Vigor</span>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">{activeBatch.name}</h3>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="text-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Trigo</span>
                  <span className="text-xl font-black">{activeBatch.targetWheat.toLocaleString('pt-BR')} kg</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Meta Farinha</span>
                  <span className="text-xl font-black text-blue-400">{activeBatch.targetFlour.toLocaleString('pt-BR')} kg</span>
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                  <span className="text-slate-400">Progresso de Moagem</span>
                  <span className="text-white">{Math.round((totalWheat / activeBatch.targetWheat) * 100)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (totalWheat / activeBatch.targetWheat) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                  <span className="text-slate-400">Produção de Farinha</span>
                  <span className="text-blue-400">{Math.round((totalFlour / activeBatch.targetFlour) * 100)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (totalFlour / activeBatch.targetFlour) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logistics & Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Time Estimation Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Clock size={16} className="text-blue-600" /> Tempo de Processamento
              </h3>
              
              <div className="space-y-3">
                {[24, 21, 12].map((hPerDay) => {
                  const totalH = remainingWheatToMill / capacity;
                  const totalD = totalH / hPerDay;
                  const d = Math.floor(totalD);
                  const h = Math.round((totalD - d) * hPerDay);
                  
                  return (
                    <div key={hPerDay} className={`p-4 rounded-2xl border flex items-center justify-between ${hPerDay === 24 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-3">
                        <Clock size={14} className={hPerDay === 24 ? 'text-blue-600' : 'text-slate-400'} />
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">{hPerDay}h/dia</span>
                      </div>
                      <span className={`text-sm font-black ${hPerDay === 24 ? 'text-blue-700' : 'text-slate-700'}`}>
                        {d > 0 ? `${d}D E ${h}H` : `${h}H`}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base do Lote:</span>
                <span className="text-xs font-black text-blue-600">{capacity.toLocaleString('pt-BR')} KG/H</span>
              </div>
            </div>

            {/* Wheat Logistics */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Wheat size={16} className="text-amber-500" /> Logística de Trigo
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cargas Recebidas</span>
                  <span className="text-3xl font-black text-slate-800">{loadsArrived}</span>
                  <span className="text-[10px] font-bold text-slate-400 block mt-1">CAMINHÕES</span>
                </div>
                <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-1">Cargas Faltantes</span>
                  <span className="text-3xl font-black text-amber-700">{loadsMissing}</span>
                  <span className="text-[10px] font-bold text-amber-600 block mt-1">ESTIMATIVA</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faltam para fechar pedido:</span>
                  <span className="text-lg font-black text-amber-600">{missingWheatKg.toLocaleString('pt-BR')} kg</span>
                </div>
              </div>
            </div>

            {/* Flour Production Prediction */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Package size={16} className="text-blue-500" /> Produção de Farinha
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest block mb-1">Bags Comum</span>
                  <span className="text-xl font-black text-blue-700">{commonBags}</span>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Bags Especial</span>
                  <span className="text-xl font-black text-indigo-700">{specialBags}</span>
                </div>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                  <span className="text-[8px] font-black text-red-600 uppercase tracking-widest block mb-1">Bags Inteira</span>
                  <span className="text-xl font-black text-red-700">{wholeBags}</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faltam para fechar meta:</span>
                  <span className="text-lg font-black text-blue-600">{missingFlourKg.toLocaleString('pt-BR')} kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Industrial Balance Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Mass Balance Card */}
            <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <Scale size={120} />
              </div>
              
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <BarChart3 size={18} /> Balanço de Massa do Lote
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Entrada Trigo</span>
                  <span className="text-xl font-black text-white">{totalWheat.toLocaleString('pt-BR')} kg</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Saída Total</span>
                  <span className="text-xl font-black text-white">{totalOutput.toLocaleString('pt-BR')} kg</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Diferença</span>
                  <span className={`text-xl font-black ${massBalance >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {massBalance.toLocaleString('pt-BR')} kg
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Perda Ind.</span>
                  <span className={`text-xl font-black ${isLossAcceptable ? 'text-emerald-400' : 'text-red-400'}`}>
                    {massBalancePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border ${isLossAcceptable ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} flex items-center gap-4`}>
                <div className={`p-3 rounded-2xl ${isLossAcceptable ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                  {isLossAcceptable ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">
                    {isLossAcceptable ? 'Balanço em Conformidade' : 'Atenção: Perda Elevada'}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {isLossAcceptable 
                      ? 'A variação está dentro do limite aceitável de 1%.' 
                      : 'A variação ultrapassou o limite industrial permitido.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Extraction Rate Card */}
            <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center">
                Extração Real
              </h3>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                  <circle
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={452.39}
                    strokeDashoffset={452.39 - (452.39 * extractionRate) / 100}
                    className="text-blue-600 transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{extractionRate.toFixed(1)}</span>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">%</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 text-center">
                Rendimento de Farinha sobre o Trigo Processado
              </p>
            </div>
          </div>

          {/* Subproducts Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Farelo (Lote)</span>
                <span className="text-lg font-black text-slate-800">{totalBran.toLocaleString('pt-BR')} kg</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowRightLeft size={18} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Resíduos (Lote)</span>
                <span className="text-lg font-black text-slate-800">{totalResidue.toLocaleString('pt-BR')} kg</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ArrowRightLeft size={18} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Outros (Lote)</span>
                <span className="text-lg font-black text-slate-800">{totalOtherSub.toLocaleString('pt-BR')} kg</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                <ArrowRightLeft size={18} />
              </div>
            </div>
          </div>
        </>
      )}

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </div>
  );
};
