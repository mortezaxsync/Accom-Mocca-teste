import React from 'react';
import { useData } from '../contexts/DataContext';
import { BigBagIcon } from './BigBagIcon';
import { resetGlueStock } from '../firebase';
import { Toast, ToastType } from './Toast';

interface FlourStockViewProps {
  onBack: () => void;
}

const STANDARD_BAG_WEIGHT = 1200;
const COLA_BAG_WEIGHT = 1050;
const TOTAL_CAPACITY = 120;

export const FlourStockView: React.FC<FlourStockViewProps> = ({ onBack }) => {
  const { stock, loadingStock } = useData();
  const [toast, setToast] = React.useState<{ message: string; type: ToastType } | null>(null);

  const calculateWeight = (bags: number, isGlue: boolean = false) => bags * (isGlue ? COLA_BAG_WEIGHT : STANDARD_BAG_WEIGHT);
  const formatWeight = (weight: number) => weight.toLocaleString('pt-BR');

  const formatLastUpdate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return null;
    try {
        const date = timestamp.toDate();
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${timeStr} - ${dateStr}`;
    } catch (e) {
        return null;
    }
  };

  const lastUpdateText = formatLastUpdate(stock.updatedAt);

  const totalBags = stock.common + stock.special + stock.whole + stock.glue;
  const occupancyPercent = Math.min(Math.round((totalBags / TOTAL_CAPACITY) * 100), 100);

  const totalWeight = 
    calculateWeight(stock.common) + 
    calculateWeight(stock.special) + 
    calculateWeight(stock.whole) + 
    calculateWeight(stock.glue, true);

  const handleResetGlue = async () => {
    if (window.confirm("Deseja realmente zerar o estoque de Cola?")) {
      const success = await resetGlueStock();
      if (success) {
        setToast({ message: "Estoque de Cola zerado com sucesso!", type: 'success' });
      } else {
        setToast({ message: "Erro ao zerar estoque de Cola.", type: 'error' });
      }
    }
  };

  // Clean Stock Card - Colored background based on flour type
  const StockCard = ({ 
    label, 
    bags, 
    colorClass, 
    iconColor,
    bgClass,
    imgUrl,
    isGlue = false
  }: { label: string, bags: number, colorClass: string, iconColor: string, bgClass: string, imgUrl?: string, isGlue?: boolean }) => (
    <div className={`p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 ${bgClass} flex items-center justify-between transition-transform active:scale-[0.99]`}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="p-1 sm:p-1.5 rounded-xl bg-white/60 border border-white/50 backdrop-blur-sm w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden">
           {imgUrl ? (
             <img src={imgUrl} alt={label} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
           ) : (
             <BigBagIcon className="w-7 h-7 sm:w-8 sm:h-8" color={iconColor} />
           )}
        </div>
        <div>
          <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1 text-slate-600">{label}</h3>
          <div className="flex items-baseline gap-1">
             <span className={`text-xl sm:text-2xl font-black ${colorClass}`}>{bags}</span>
             <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase">Begs</span>
          </div>
        </div>
      </div>
      <div className="text-right">
         <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Peso Aprox.</p>
         <p className="text-base sm:text-lg font-bold text-slate-800 flex items-baseline justify-end gap-1">
            {formatWeight(calculateWeight(bags, isGlue))}
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">kg</span>
         </p>
      </div>
    </div>
  );

  return (
    <div className="w-full pb-12 animate-fadeIn font-inter">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Gestão de Estoque</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Monitoramento de Begs e Pesagem Total</p>
        </div>
        
        <div className="flex items-center gap-4">
          {!loadingStock && (
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sincronizado</span>
              </div>
          )}
          <button 
            onClick={onBack}
            className="p-3 text-slate-500 hover:text-slate-800 transition-colors bg-white rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {loadingStock ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Carregando Inventário...</span>
        </div>
      ) : (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StockCard 
                 label="Especial Tipo 1" 
                 bags={stock.special} 
                 colorClass="text-blue-700" 
                 iconColor="#2563EB" 
                 bgClass="bg-blue-50"
                 imgUrl="https://i.ibb.co/3yYgYdjn/image.png"
              />
              <StockCard 
                 label="Comum Tipo 2" 
                 bags={stock.common} 
                 colorClass="text-emerald-700" 
                 iconColor="#10B981" 
                 bgClass="bg-emerald-50"
                 imgUrl="https://i.ibb.co/r2PbxJbz/image.png"
              />
              <StockCard 
                 label="Inteira Tipo 3" 
                 bags={stock.whole} 
                 colorClass="text-red-700" 
                 iconColor="#DC2626" 
                 bgClass="bg-red-50"
                 imgUrl="https://i.ibb.co/Xn0XLJM/image.png"
              />
              <StockCard 
                 label="Cola" 
                 bags={stock.glue} 
                 colorClass="text-slate-800" 
                 iconColor="#171717" 
                 bgClass="bg-slate-100"
                 imgUrl="https://i.ibb.co/8LDzkhh8/image.png"
                 isGlue={true}
              />
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-center shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BigBagIcon className="w-32 h-32" color="#ffffff" />
                 </div>
                 <div className="relative z-10">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Peso Total em Farinha</span>
                    <div className="flex flex-col items-center">
                      <span className="text-5xl font-black text-white tracking-tighter mb-2">
                         {formatWeight(totalWeight)}
                      </span>
                      <span className="text-xl font-bold text-blue-500 uppercase tracking-widest">Quilogramas</span>
                    </div>
                    
                    <div className="mt-8 mb-8">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ocupação do Estoque</span>
                          <span className="text-xs font-black text-blue-400">{occupancyPercent}%</span>
                       </div>
                       <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${occupancyPercent}%` }}
                          />
                       </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                       <div className="text-left">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Begs</span>
                          <span className="text-xl font-black text-white tracking-tight">{totalBags}</span>
                       </div>
                       <div className="text-right">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Toneladas</span>
                          <span className="text-xl font-black text-white tracking-tight">{(totalWeight / 1000).toFixed(1)}t</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {lastUpdateText && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Última Atualização do Inventário</span>
                    <p className="text-slate-700 font-black text-sm uppercase tracking-tight">
                        {lastUpdateText}
                    </p>
                  </div>
                </div>
                <button className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
                  Imprimir Relatório
                </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};