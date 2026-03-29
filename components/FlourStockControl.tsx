
import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { saveStock, createLoad, updateLoadStep, finalizeLoad, subscribeToLoads, updateLoadQtyWithStock, getActiveBatch, resetActiveLoadsAndStock, resetStockField, deleteLoad } from '../firebase';
import { Load, LoadType, StockData } from '../types';
import { Package, Truck, CheckCircle2, Beaker, Scale, ClipboardCheck, Plus, Minus, Check, ArrowRight, X, RefreshCw, Trash2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from './ConfirmModal';
import { Toast, ToastType } from './Toast';

interface FlourStockControlProps {
  onBack: () => void;
}

const TYPE_MAP: Record<LoadType, { name: string; color: string; bg: string; border: string; accent: string; icon: string; imgUrl?: string }> = {
  E: { 
    name: 'Especial', 
    color: 'text-blue-700', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    accent: 'bg-blue-700',
    icon: 'E',
    imgUrl: 'https://ibb.co/3yYgYdjn'
  },
  C: { 
    name: 'Comum', 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200', 
    accent: 'bg-emerald-600',
    icon: 'C',
    imgUrl: 'https://ibb.co/r2PbxJbz'
  },
  I: { 
    name: 'Inteira', 
    color: 'text-red-700', 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    accent: 'bg-red-600',
    icon: 'I',
    imgUrl: 'https://ibb.co/Xn0XLJM'
  },
  CL: { 
    name: 'Cola', 
    color: 'text-slate-900', 
    bg: 'bg-slate-50', 
    border: 'border-slate-300', 
    accent: 'bg-slate-800',
    icon: 'CL',
    imgUrl: 'https://ibb.co/8LDzkhh8'
  }
};

const STEPS = [
  { id: 1, label: 'Contagem bags', icon: Package },
  { id: 2, label: 'Amostra coletada', icon: DropletsIcon },
  { id: 3, label: 'Laboratório enviado', icon: Beaker },
  { id: 4, label: 'Análise confirmada', icon: ClipboardCheck },
  { id: 5, label: 'Carga pesada', icon: Scale },
  { id: 6, label: 'Aguardando entrega', icon: ClockIcon },
  { id: 7, label: 'Entrega finalizada', icon: Truck }
];

function DropletsIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.8 4-4 0-3.3-4-8-4-8s-4 4.7-4 8c0 2.2 1.8 4 4 4Z"/><path d="M17 16.3c2.2 0 4-1.8 4-4 0-3.3-4-8-4-8s-4 4.7-4 8c0 2.2 1.8 4 4 4Z"/></svg>;
}

function ClockIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

// Componente da Minuta (Adesivo)
const MinutaModal: React.FC<{ isOpen: boolean; onClose: () => void; load: Load | null }> = ({ isOpen, onClose, load }) => {
  if (!load) return null;

  const fabricationDate = load.createdAt?.toDate ? new Date(load.createdAt.toDate()) : new Date();
  const validityDate = new Date(fabricationDate);
  validityDate.setMonth(validityDate.getMonth() + 3);

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear().toString().slice(-2);
    return `${d}.${m}.${y}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] overflow-y-auto p-4 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-xl w-full max-w-[400px] shadow-2xl overflow-hidden relative z-10 p-6 font-sans my-auto"
          >
            <div className="border-4 border-slate-800 p-4 relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col items-center w-[100px]">
                  <div className="flex flex-col items-center border-2 border-slate-800 p-1 px-3">
                    <span className="text-3xl font-black text-slate-800 leading-none">M</span>
                    <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest">MOCCA</span>
                  </div>
                  <span className="text-[7px] font-bold text-slate-800 uppercase mt-1 text-center leading-tight">Moinho Comercial<br/>de Céu Azul</span>
                </div>
                <div className="flex-grow text-center px-2">
                  <h2 className="text-xl font-black text-blue-900 uppercase tracking-tighter border-b-2 border-slate-800 pb-1 mb-2">Farinha de Trigo</h2>
                  <div className="grid grid-cols-2 gap-x-4 text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold min-w-[45px]">TIPO 1:</span>
                      <span className="text-lg font-black ml-2">{load.type === 'E' ? 'X' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold min-w-[45px]">TIPO 3:</span>
                      <div className="border-b border-slate-800 flex-grow mb-1 h-5 flex items-center justify-center">
                        <span className="text-lg font-black">{load.type === 'I' ? 'X' : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold min-w-[45px]">TIPO 2:</span>
                      <div className="border-b border-slate-800 flex-grow mb-1 h-5 flex items-center justify-center">
                        <span className="text-lg font-black">{load.type === 'C' ? 'X' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="flex items-end flex-grow border-b border-slate-800 pb-0.5">
                    <span className="text-[10px] font-bold mr-2 whitespace-nowrap">CLIENTE:</span>
                    <span className="text-sm font-black uppercase flex-grow italic leading-none">{load.client || 'NINFA'}</span>
                  </div>
                  <div className="flex items-end gap-1 border-b border-slate-800 pb-0.5 min-w-[120px]">
                    <span className="text-[8px] font-bold whitespace-nowrap">LOTE:</span>
                    <div className="flex-grow text-center">
                      <span className="text-[10px] font-black">{load.batchName || '---'}</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 border-b border-slate-800 pb-0.5 min-w-[80px]">
                    <span className="text-[8px] font-bold whitespace-nowrap">PESO LÍQUIDO</span>
                    <div className="flex-grow text-center">
                      <span className="text-xs font-black">{load.weight ? Number(load.weight).toLocaleString('pt-BR') : ''}</span>
                    </div>
                    <span className="text-[8px] font-bold">KG</span>
                  </div>
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex items-end flex-grow border-b border-slate-800 pb-0.5">
                    <span className="text-[8px] font-bold mr-2 whitespace-nowrap uppercase">MOTORISTA:</span>
                    <span className="text-[10px] font-black uppercase flex-grow italic leading-none">{load.driverName || '---'}</span>
                  </div>
                  <div className="flex items-end gap-1 border-b border-slate-800 pb-0.5 min-w-[120px]">
                    <span className="text-[8px] font-bold whitespace-nowrap uppercase">PLACA:</span>
                    <div className="flex-grow text-center">
                      <span className="text-[10px] font-black uppercase">{load.vehiclePlate || '---'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end gap-4">
                  <div className="flex flex-col gap-3 flex-grow">
                    <div className="flex items-end">
                      <span className="text-[8px] font-bold mr-1 whitespace-nowrap">DATA DE FABRICAÇÃO:</span>
                      <div className="border-b border-slate-800 flex-grow text-center">
                        <span className="text-sm font-black">{formatDate(fabricationDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <span className="text-[8px] font-bold mr-1 whitespace-nowrap">DATA DE VAL:</span>
                      <div className="border-b border-slate-800 flex-grow text-center">
                        <span className="text-sm font-black">{formatDate(validityDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 w-[120px]">
                    <div className="flex items-end w-full">
                      <span className="text-[8px] font-bold mr-1 whitespace-nowrap">LOTE Nº:</span>
                      <div className="border-b border-slate-800 flex-grow text-center">
                        <span className="text-xs font-black">{load.loadId}</span>
                      </div>
                    </div>
                    <div className="flex items-end w-full">
                      <span className="text-[8px] font-bold mr-1 whitespace-nowrap">Nº BIG BAG:</span>
                      <div className="border-b border-slate-800 flex-grow text-center">
                        <span className="text-xs font-black">{load.currentQty}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-[8px] font-bold uppercase">Contém Glúten | Enriquecida com Ferro e Ácido Fólico.</span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
            >
              Fechar Minuta
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const formatNumber = (val: string) => {
  const numeric = val.replace(/\D/g, '');
  if (!numeric) return '';
  return Number(numeric).toLocaleString('pt-BR');
};

export const FlourStockControl: React.FC<FlourStockControlProps> = ({ onBack }) => {
  const { stock, batches: allBatches, loadingBatches, loads } = useData(); 
  const activeBatches = allBatches.filter(b => b.status === 'OPEN');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState<Load | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });
  const [newLoadType, setNewLoadType] = useState<LoadType>('E');
  const [newLoadQty, setNewLoadQty] = useState('26');
  const [newLoadClient, setNewLoadClient] = useState('NINFA');
  const [newLoadBatchId, setNewLoadBatchId] = useState('');
  const [showMinuta, setShowMinuta] = useState<Load | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Load | null>(null);
  const [adjustingStock, setAdjustingStock] = useState<{ field: keyof StockData; label: string } | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingLoads, setPendingLoads] = useState<Set<string>>(new Set());
  const [weightInput, setWeightInput] = useState<Record<string, string>>({});
  const [driverInput, setDriverInput] = useState<Record<string, string>>({});
  const [plateInput, setPlateInput] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activeBatches.length === 1 && !newLoadBatchId) {
      setNewLoadBatchId(activeBatches[0].id);
    }
  }, [activeBatches, newLoadBatchId]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const generateLoadId = (type: LoadType) => {
    const now = new Date();
    const dayMap = ['D', 'S', 'T', 'QA', 'Q', 'SX', 'SA'];
    return `${type}${dayMap[now.getDay()]}${now.getDate()}`;
  };

  const handleCreateLoad = async () => {
    if (!newLoadBatchId) {
      showToast("Selecione um lote para registrar a movimentação.", "error");
      return;
    }

    // Close modal immediately for "instant" feel
    setShowAddModal(false);
    setIsProcessing(true);
    
    try {
      const selectedBatch = activeBatches.find(b => b.id === newLoadBatchId);

      const success = await createLoad({
        loadId: generateLoadId(newLoadType),
        type: newLoadType,
        quantity: Number(newLoadQty.replace(/\./g, '').replace(',', '.')) || 0,
        currentQty: 0,
        client: newLoadClient,
        step: 1
      }, {
        id: newLoadBatchId,
        name: selectedBatch?.name || ''
      });
      
      if (!success) {
        showToast("Erro ao criar carga. Verifique sua conexão.", "error");
        setShowAddModal(true);
      } else {
        showToast("Carga criada com sucesso!", "success");
        setNewLoadQty('26');
        setNewLoadClient('NINFA');
        setNewLoadBatchId(activeBatches.length === 1 ? activeBatches[0].id : '');
      }
    } catch (error) {
      showToast("Erro ao criar carga.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextStep = async (load: Load) => {
    if (pendingLoads.has(load.id)) return;
    
    if (load.step === 7) {
      setConfirmFinalize(load);
      return;
    }

    setPendingLoads(prev => new Set(prev).add(load.id));
    try {
      let success = false;
      if (load.step === 5) {
        const rawWeight = weightInput[load.id];
        const normalizedWeight = rawWeight?.replace(/\./g, '').replace(',', '.');
        const weight = parseFloat(normalizedWeight || '');
        const driverName = driverInput[load.id] || '';
        const vehiclePlate = plateInput[load.id] || '';
        
        if (!rawWeight || isNaN(weight) || weight <= 0) {
          showToast("Por favor, digite um peso válido.", "error");
          setPendingLoads(prev => {
            const next = new Set(prev);
            next.delete(load.id);
            return next;
          });
          return;
        }

        if (!driverName || !vehiclePlate) {
          showToast("Por favor, preencha o motorista e a placa.", "error");
          setPendingLoads(prev => {
            const next = new Set(prev);
            next.delete(load.id);
            return next;
          });
          return;
        }

        success = await updateLoadStep(load.id, 6, { weight, driverName, vehiclePlate });
        if (success) {
          setWeightInput(prev => {
            const next = { ...prev };
            delete next[load.id];
            return next;
          });
          setDriverInput(prev => {
            const next = { ...prev };
            delete next[load.id];
            return next;
          });
          setPlateInput(prev => {
            const next = { ...prev };
            delete next[load.id];
            return next;
          });
        }
      } else {
        success = await updateLoadStep(load.id, load.step + 1);
      }

      if (success) {
        showToast("Etapa atualizada!", "success");
      } else {
        showToast("Erro ao atualizar etapa no banco de dados.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar etapa.", "error");
    } finally {
      setPendingLoads(prev => {
        const next = new Set(prev);
        next.delete(load.id);
        return next;
      });
    }
  };

  const handleFinalize = async () => {
    if (!confirmFinalize) return;
    const loadId = confirmFinalize.id;
    setPendingLoads(prev => new Set(prev).add(loadId));
    setConfirmFinalize(null);
    
    try {
      const success = await finalizeLoad(loadId);
      if (success) {
        showToast("Carga finalizada com sucesso!", "success");
      } else {
        showToast("Erro ao finalizar carga.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar finalização.", "error");
    } finally {
      setPendingLoads(prev => {
        const next = new Set(prev);
        next.delete(loadId);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const loadId = confirmDelete.id;
    setPendingLoads(prev => new Set(prev).add(loadId));
    setConfirmDelete(null);
    
    try {
      const success = await deleteLoad(loadId);
      if (success) {
        showToast("Carga excluída com sucesso!", "success");
      } else {
        showToast("Erro ao excluir carga.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar exclusão.", "error");
    } finally {
      setPendingLoads(prev => {
        const next = new Set(prev);
        next.delete(loadId);
        return next;
      });
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    setIsProcessing(true);
    try {
      const success = await resetActiveLoadsAndStock();
      if (success) {
        showToast("Estoque e cargas zerados com sucesso!", "success");
      } else {
        showToast("Erro ao zerar contadores.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar solicitação.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustField = (field: keyof StockData, label: string) => {
    const currentVal = stock[field] || 0;
    setAdjustingStock({ field, label });
    setAdjustValue(currentVal.toString());
  };

  const confirmAdjust = async () => {
    if (!adjustingStock || adjustValue === "" || isNaN(Number(adjustValue))) return;
    
    const newVal = Number(adjustValue);
    if (newVal < 0) {
      showToast("O estoque não pode ser negativo.", "error");
      return;
    }

    const { field, label } = adjustingStock;
    setAdjustingStock(null);
    setIsProcessing(true);
    
    try {
      const success = await saveStock({ ...stock, [field]: newVal });
      if (success) {
        showToast(`Estoque de ${label} atualizado para ${newVal}!`, "success");
      } else {
        showToast(`Erro ao atualizar ${label}.`, "error");
      }
    } catch (error) {
      showToast("Erro ao salvar alteração.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIncrement = async (load: Load) => {
    if (pendingLoads.has(load.id)) return;
    if (load.currentQty >= load.quantity) {
      showToast("Quantidade máxima atingida.", "error");
      return;
    }
    
    setPendingLoads(prev => new Set(prev).add(load.id));
    try {
      const success = await updateLoadQtyWithStock(load.id, load.currentQty + 1, load.type, true);
      if (!success) {
        showToast("Erro ao atualizar estoque.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar incremento.", "error");
    } finally {
      setPendingLoads(prev => {
        const next = new Set(prev);
        next.delete(load.id);
        return next;
      });
    }
  };

  const handleDecrement = async (load: Load) => {
    if (pendingLoads.has(load.id)) return;
    if (load.currentQty <= 0) return;
    
    setPendingLoads(prev => new Set(prev).add(load.id));
    try {
      const success = await updateLoadQtyWithStock(load.id, load.currentQty - 1, load.type, false);
      if (!success) {
        showToast("Erro ao atualizar estoque.", "error");
      }
    } catch (error) {
      showToast("Erro ao processar decremento.", "error");
    } finally {
      setPendingLoads(prev => {
        const next = new Set(prev);
        next.delete(load.id);
        return next;
      });
    }
  };

  const activeLoads = loads.filter(l => l.status === 'ATIVO');
  const finalizedLoads = loads.filter(l => l.status === 'FINALIZADO');

  const totalExpedited = finalizedLoads.reduce((acc, curr) => acc + (curr.weight || 0), 0);
  const totalLoadsCount = finalizedLoads.length;

  return (
    <div className="w-full px-4 sm:px-4 pb-12 animate-fadeIn font-inter flex flex-col h-full bg-slate-50 min-h-screen">
      
      {/* Header Fixo */}
      <div className="flex items-center justify-between mb-4 pt-4 sticky top-0 bg-slate-50 z-10 pb-2 px-1 sm:px-0">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 sm:p-2.5 mr-2 sm:mr-3 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase leading-none">Saída Farinha</h2>
            <p className="text-[7px] sm:text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Gestão de Farinhas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowResetConfirm(true)} 
            disabled={isProcessing}
            className="p-2 sm:p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            title="Zerar Cargas Ativas e Estoque (C/E)"
          >
             <RefreshCw className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-[#2563eb] text-white p-2 sm:p-2.5 rounded-xl shadow-lg active:scale-95 transition-all">
             <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Expedido</span>
           <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-slate-800 tracking-tighter">
               {totalExpedited.toLocaleString('pt-BR')}
             </span>
             <span className="text-xs font-bold text-slate-400 uppercase">kg</span>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Registros</span>
           <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-slate-800 tracking-tighter">{totalLoadsCount}</span>
             <span className="text-xs font-bold text-slate-400 uppercase">Cargas</span>
           </div>
        </div>
      </div>

      {/* Resumo Rápido Estoque */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          <button 
            onClick={() => handleAdjustField('special', 'Especial')}
            disabled={isProcessing}
            className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative group"
            title="Ajustar Estoque"
          >
             <Settings className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-200 group-hover:text-blue-500 transition-colors" />
             <span className="text-[8px] font-black text-blue-600 block uppercase mb-0.5">ESP</span>
             <span className="text-base font-black text-slate-700">{stock.special}</span>
          </button>
          <button 
            onClick={() => handleAdjustField('common', 'Comum')}
            disabled={isProcessing}
            className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative group"
            title="Ajustar Estoque"
          >
             <Settings className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-200 group-hover:text-emerald-500 transition-colors" />
             <span className="text-[8px] font-black text-emerald-600 block uppercase mb-0.5">COM</span>
             <span className="text-base font-black text-slate-700">{stock.common}</span>
          </button>
          <button 
            onClick={() => handleAdjustField('whole', 'Integral')}
            disabled={isProcessing}
            className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative group"
            title="Ajustar Estoque"
          >
             <Settings className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-200 group-hover:text-red-500 transition-colors" />
             <span className="text-[8px] font-black text-red-600 block uppercase mb-0.5">INT</span>
             <span className="text-base font-black text-slate-700">{stock.whole}</span>
          </button>
          <button 
            onClick={() => handleAdjustField('glue', 'Cola')}
            disabled={isProcessing}
            className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm hover:bg-slate-50 transition-colors active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center relative group"
            title="Ajustar Estoque"
          >
             <Settings className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-slate-200 group-hover:text-slate-900 transition-colors" />
             <span className="text-[8px] font-black text-slate-900 block uppercase mb-0.5">COL</span>
             <span className="text-base font-black text-slate-700">{stock.glue}</span>
          </button>
      </div>

      {/* Seção de Cargas Ativas */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cargas Ativas</h3>
           <div className="h-[1px] flex-grow bg-slate-200/60"></div>
           <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full">{activeLoads.length}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {activeLoads.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12 opacity-30 flex flex-col items-center bg-white rounded-[2rem] border border-dashed border-slate-300 col-span-full"
              >
                 <Truck className="w-12 h-12 mb-2 text-slate-400" />
                 <p className="font-black text-[10px] uppercase tracking-widest">Nenhuma carga em andamento</p>
              </motion.div>
            ) : activeLoads.map(load => (
              <motion.div
                key={load.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <LoadCard 
                  load={load} 
                  isPending={pendingLoads.has(load.id)}
                  onNext={() => handleNextStep(load)} 
                  onIncrement={() => handleIncrement(load)}
                  onDecrement={() => handleDecrement(load)}
                  onShowMinuta={() => setShowMinuta(load)}
                  onDelete={() => setConfirmDelete(load)}
                  weightInput={weightInput} 
                  setWeightInput={setWeightInput} 
                  driverInput={driverInput}
                  setDriverInput={setDriverInput}
                  plateInput={plateInput}
                  setPlateInput={setPlateInput}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Seção de Histórico */}
      <div>
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Finalizadas Recentemente</h3>
           <div className="h-[1px] flex-grow bg-slate-200/60"></div>
           <span className="bg-slate-200 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full">{finalizedLoads.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {finalizedLoads.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 opacity-20 col-span-full"
              >
                 <p className="font-black text-[9px] uppercase tracking-widest">Histórico vazio</p>
              </motion.div>
            ) : finalizedLoads.slice(0, 10).map(load => (
              <motion.div 
                key={load.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-2.5 sm:p-3 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between"
              >
                 <div className="flex items-center gap-3 sm:gap-4">
                   <ProductBadge type={load.type} size="sm" />
                   <div>
                     <h4 className="text-sm sm:text-base font-black text-slate-800 uppercase leading-none mb-1">{load.loadId}</h4>
                     {load.client && (
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-0.5">
                         Cliente: {load.client}
                       </p>
                     )}
                     {(load.driverName || load.vehiclePlate) && (
                       <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tight mb-1">
                         {load.driverName && `Mot: ${load.driverName}`}
                         {load.driverName && load.vehiclePlate && ' | '}
                         {load.vehiclePlate && `Placa: ${load.vehiclePlate}`}
                       </p>
                     )}
                     <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                       {load.quantity} Bags • {load.weight ? `${load.weight.toLocaleString('pt-BR')} kg` : 'Sem peso'}
                     </p>
                   </div>
                 </div>
                 <div className="text-right pr-1 sm:pr-2">
                   <span className="text-[7px] sm:text-[8px] font-black text-slate-300 uppercase block mb-0.5 sm:mb-1">Finalizada</span>
                   <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase">
                     {load.updatedAt?.toDate ? new Date(load.updatedAt.toDate()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--'}
                   </span>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Adicionar Carga */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden relative z-10 my-auto"
            >
              <div className="bg-[#2563eb] p-6 text-white text-center relative">
                <h3 className="text-xl font-black uppercase tracking-widest">Nova Carga</h3>
                <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                 {/* Seleção de Lote */}
                 <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                   <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Para qual lote deseja registrar esta movimentação?</label>
                   <div className="grid grid-cols-2 gap-2">
                     {loadingBatches ? (
                       <div className="col-span-full py-2 text-center text-blue-500 font-bold text-[10px] uppercase flex items-center justify-center gap-2">
                         <RefreshCw className="animate-spin w-3 h-3" />
                         Carregando...
                       </div>
                     ) : activeBatches.length === 0 ? (
                       <div className="col-span-full py-2 text-center text-red-500 font-bold text-[10px] uppercase">
                         Nenhum lote ativo encontrado.
                       </div>
                     ) : activeBatches.map(batch => (
                       <button
                         key={batch.id}
                         onClick={() => setNewLoadBatchId(batch.id)}
                         className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                           newLoadBatchId === batch.id 
                             ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                             : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                         }`}
                       >
                         <div className="flex items-center gap-2">
                           <Package size={14} className={newLoadBatchId === batch.id ? 'text-white' : 'text-blue-500'} />
                           <span className="font-black text-[10px] tracking-tight uppercase">{batch.name}</span>
                         </div>
                         {newLoadBatchId === batch.id && <CheckCircle2 size={12} />}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo da Farinha</label>
                    <div className="grid grid-cols-2 gap-2">
                       {(['E', 'C', 'I', 'CL'] as LoadType[]).map(t => (
                          <button key={t} onClick={() => setNewLoadType(t)} className={`py-3 rounded-2xl border-2 transition-all font-black text-xs ${newLoadType === t ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                            {TYPE_MAP[t].name}
                          </button>
                       ))}
                    </div>
                 </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Quantidade Alvo (Bags)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={newLoadQty} 
                      onChange={e => {
                        setNewLoadQty(formatNumber(e.target.value));
                      }} 
                      className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xl font-black text-center text-slate-700 outline-none focus:border-blue-500 transition-all" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase">Bags</div>
                  </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cliente</label>
                    <input 
                      type="text" 
                      value={newLoadClient} 
                      onChange={e => setNewLoadClient(e.target.value.toUpperCase())} 
                      placeholder="Ex: NINFA"
                      className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 text-lg font-black text-center text-slate-700 outline-none focus:border-blue-500 transition-all" 
                    />
                 </div>
                 
                 <div className="flex gap-2">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Cancelar</button>
                    <button onClick={handleCreateLoad} disabled={isProcessing} className="flex-[2] bg-[#2563eb] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                      Iniciar Carga
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmFinalize}
        onClose={() => setConfirmFinalize(null)}
        onConfirm={handleFinalize}
        title="Finalizar Carga"
        message={`Deseja realmente finalizar a carga ${confirmFinalize?.loadId}? Ela será movida para o histórico.`}
        confirmText="Finalizar"
        variant="primary"
      />

      <ConfirmModal 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Carga"
        message={`Deseja realmente excluir a carga ${confirmDelete?.loadId}? O estoque será ajustado automaticamente.`}
        confirmText="Excluir"
        variant="danger"
      />

      <MinutaModal 
        isOpen={!!showMinuta}
        onClose={() => setShowMinuta(null)}
        load={showMinuta}
      />

      <Toast 
        isVisible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, visible: false }))} 
      />
    </div>
  );
};

// Helper para transformar links do ImgBB em links diretos
const getDirectImgUrl = (url?: string) => {
  if (!url) return undefined;
  // Se for um link de página do ImgBB, tenta converter para o link direto da imagem
  if (url.includes('ibb.co') && !url.includes('i.ibb.co')) {
    const code = url.split('/').pop();
    // O ImgBB usa i.ibb.co/CODE/image.png para links diretos
    return `https://i.ibb.co/${code}/image.png`;
  }
  return url;
};

// Componente de Selo de Produto (Recriando o Logo Mocca via CSS/SVG ou Imagem)
const ProductBadge: React.FC<{ type: LoadType; size?: 'sm' | 'md' | 'lg' }> = ({ type, size = 'md' }) => {
  const meta = TYPE_MAP[type];
  const [imgError, setImgError] = React.useState(false);
  const directUrl = getDirectImgUrl(meta.imgUrl);
  
  const sizes = {
    sm: { container: 'w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2', font: 'text-lg sm:text-xl', wheat: 'w-7 h-7 sm:w-8 sm:h-8', label: 'text-[4px] sm:text-[5px]', m: 'text-lg sm:text-xl', p: 'p-2' },
    md: { container: 'w-20 h-20 sm:w-24 sm:h-24 rounded-[1.8rem] sm:rounded-[2.2rem] border-4', font: 'text-3xl sm:text-4xl', wheat: 'w-12 h-12 sm:w-14 sm:h-14', label: 'text-[6px] sm:text-[7px]', m: 'text-3xl sm:text-4xl', p: 'p-4' },
    lg: { container: 'w-24 h-24 sm:w-28 sm:h-28 rounded-[2.2rem] sm:rounded-[2.8rem] border-4', font: 'text-4xl sm:text-5xl', wheat: 'w-14 h-14 sm:w-16 sm:h-16', label: 'text-[7px] sm:text-[8px]', m: 'text-4xl sm:text-5xl', p: 'p-5' }
  };
  const s = sizes[size];

  // Se temos uma imagem e ela não deu erro, mostramos apenas a imagem
  const showImage = directUrl && !imgError;

  return (
    <div className={`${s.container} ${showImage ? 'bg-white' : meta.bg} border-white shadow-lg flex flex-col items-center justify-center relative overflow-hidden`}>
       {/* Efeito de Brilho Animado (Otimizado) */}
       <motion.div 
         initial={{ x: '-100%' }}
         animate={{ x: '100%' }}
         transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 4 }}
         className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none skew-x-12 z-20"
       />
       
      {showImage ? (
        <div className={`w-full h-full ${s.p} flex items-center justify-center z-10`}>
          <img 
            src={directUrl} 
            alt={meta.name} 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
         <>
           {/* Ícone de Trigo (SVG detalhado para parecer o logo) */}
           <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={meta.color}>
                 <path d="M6 18c0-3 2-6 6-6s6 3 6 6M12 12V2M8 5l4 4 4-4" />
              </svg>
           </div>

           {/* Letra M Estilizada */}
           <div className="relative z-10 flex flex-col items-center">
              <span className={`${s.m} font-black ${meta.color} tracking-tighter leading-none`}>M</span>
              <span className={`${s.label} font-black ${meta.color} uppercase tracking-[0.2em] -mt-0.5`}>MOCCA</span>
           </div>
         </>
       )}

       {/* Faixa Inferior com Nome do Tipo (Targa) - Sempre visível */}
       <div className={`absolute bottom-0 left-0 right-0 ${meta.accent} py-0.5 z-40`}>
          <span className={`${s.label} font-black text-white uppercase tracking-[0.1em] block text-center`}>{meta.name}</span>
       </div>
    </div>
  );
};

// Componente do Card de Carga com Timeline e Contador Dinâmico
const LoadCard: React.FC<{ 
  load: Load; 
  isPending: boolean;
  onNext: () => void | Promise<void>; 
  onIncrement: () => void | Promise<void>;
  onDecrement: () => void | Promise<void>;
  onShowMinuta: () => void;
  onDelete: () => void;
  weightInput: Record<string, string>; 
  setWeightInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  driverInput: Record<string, string>;
  setDriverInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  plateInput: Record<string, string>;
  setPlateInput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}> = ({ load, isPending, onNext, onIncrement, onDecrement, onShowMinuta, onDelete, weightInput, setWeightInput, driverInput, setDriverInput, plateInput, setPlateInput }) => {
  const meta = TYPE_MAP[load.type];
  const isTargetReached = load.currentQty >= load.quantity;
  
  return (
    <div className={`bg-white rounded-[2rem] sm:rounded-[2.5rem] border ${meta.border} shadow-xl overflow-hidden relative`}>
       {/* Top Row com Selo de Produto */}
       <div className="p-4 sm:p-6 flex justify-between items-center bg-white">
          <div className="flex gap-3 sm:gap-5 items-center">
             <ProductBadge type={load.type} size="md" />
             <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none uppercase mb-1.5">{load.loadId}</h3>
                <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                      <span className={`text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-1 rounded-full ${meta.bg} ${meta.color} uppercase tracking-widest border border-white shadow-sm`}>
                         Farinha {meta.name}
                      </span>
                      {load.client && (
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider">
                          {load.client}
                        </span>
                      )}
                   </div>
                   {(load.driverName || load.vehiclePlate) && (
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                        {load.driverName && `Mot: ${load.driverName}`}
                        {load.driverName && load.vehiclePlate && ' | '}
                        {load.vehiclePlate && `Placa: ${load.vehiclePlate}`}
                      </p>
                   )}
                </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <button 
               onClick={onDelete}
               disabled={isPending}
               className="p-3 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 active:scale-90 transition-all disabled:opacity-50"
               title="Excluir Carga"
             >
               <Trash2 className="w-5 h-5" />
             </button>
             <div className="bg-slate-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-100 shadow-inner flex flex-col items-center gap-1">
                <button 
                  onClick={onShowMinuta}
                  className="bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm active:scale-95 transition-all mb-1"
                >
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Minuta</span>
                </button>
                <div className="text-center">
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Etapa</span>
                  <span className="text-lg sm:text-xl font-black text-slate-700 leading-none">{load.step}<span className="text-slate-300 text-xs sm:text-sm">/7</span></span>
                </div>
             </div>
          </div>
       </div>

       {/* Timeline Visual */}
       <div className="px-4 sm:px-8 pb-6">
          <div className="flex justify-between items-center relative py-2">
             <div className="absolute h-1 bg-slate-100 left-2 right-2 top-1/2 -translate-y-1/2 z-0 rounded-full" />
             <div className="absolute h-1 bg-blue-500 left-2 top-1/2 -translate-y-1/2 z-0 transition-all duration-700 rounded-full" style={{ width: `${((load.step - 1) / 6) * 100}%` }} />
             
             {STEPS.map((s) => {
               const Icon = s.icon;
               const isDone = load.step > s.id;
               const isCurrent = load.step === s.id;
               
               return (
                 <div key={s.id} className="relative z-10 flex flex-col items-center">
                    <motion.div 
                      animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isDone ? 'bg-blue-500 text-white shadow-lg' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xl' : 'bg-white border-2 border-slate-100 text-slate-200'}`}
                    >
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </motion.div>
                 </div>
               );
             })}
          </div>
          <p className="text-center text-[9px] sm:text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] sm:tracking-[0.25em] mt-4 bg-blue-50 py-1.5 rounded-full mx-4 sm:mx-10">
            {STEPS.find(s => s.id === load.step)?.label}
          </p>
       </div>

       {/* Dynamic Counting Area (Step 1) */}
       {load.step === 1 && (
         <div className="px-4 sm:px-6 pb-6 pt-2">
            <div className="bg-slate-50 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 flex flex-col items-center shadow-inner">
               <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-6">Contagem de Bags</span>
               
               <div className="flex items-center justify-between w-full max-w-[240px]">
                  <button 
                    onClick={onDecrement}
                    disabled={isPending || load.currentQty <= 0}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.2rem] sm:rounded-[1.5rem] bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 active:scale-90 transition-all disabled:opacity-50"
                  >
                    <Minus className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
                  
                  <div className="text-center">
                     <motion.span 
                       key={load.currentQty}
                       initial={{ scale: 1.5, y: -10, opacity: 0 }}
                       animate={{ scale: 1, y: 0, opacity: 1, color: isTargetReached ? "#10b981" : "#1e293b" }}
                       className={`text-5xl sm:text-6xl font-black tabular-nums leading-none block tracking-tighter`}
                     >
                        {load.currentQty}
                     </motion.span>
                     <span className="text-[10px] sm:text-[11px] font-black text-slate-300 block mt-2 uppercase tracking-widest">de {load.quantity}</span>
                  </div>
                  
                  <button 
                    onClick={onIncrement}
                    disabled={isPending || load.currentQty >= load.quantity}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1.2rem] sm:rounded-[1.5rem] bg-blue-600 shadow-lg shadow-blue-200 flex items-center justify-center text-white active:scale-90 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
                  </button>
               </div>

               <AnimatePresence>
                 {isTargetReached && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="mt-6 flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-full shadow-lg shadow-emerald-100"
                   >
                      <Check className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Meta Atingida!</span>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
         </div>
       )}

       {/* Action Area */}
       <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col gap-4">
          {load.step === 5 && (
             <div className="space-y-3">
                <div className="relative">
                   <input 
                     type="text" 
                     inputMode="numeric"
                     placeholder="DIGITE O PESO TOTAL (KG)" 
                     value={weightInput[load.id] || ''}
                     onChange={e => {
                       const val = formatNumber(e.target.value);
                       setWeightInput({...weightInput, [load.id]: val});
                     }}
                     disabled={isPending}
                     className="w-full bg-white border-2 border-blue-100 p-5 rounded-[1.5rem] font-black text-center text-lg outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all disabled:opacity-50 shadow-sm"
                   />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="relative">
                      <input 
                        type="text" 
                        placeholder="NOME DO MOTORISTA" 
                        value={driverInput[load.id] || ''}
                        onChange={e => setDriverInput({...driverInput, [load.id]: e.target.value.toUpperCase()})}
                        disabled={isPending}
                        className="w-full bg-white border-2 border-slate-100 p-4 rounded-[1.2rem] font-black text-center text-[10px] outline-none focus:border-blue-500 transition-all disabled:opacity-50 shadow-sm"
                      />
                   </div>
                   <div className="relative">
                      <input 
                        type="text" 
                        placeholder="PLACA DO VEÍCULO" 
                        value={plateInput[load.id] || ''}
                        onChange={e => setPlateInput({...plateInput, [load.id]: e.target.value.toUpperCase()})}
                        disabled={isPending}
                        className="w-full bg-white border-2 border-slate-100 p-4 rounded-[1.2rem] font-black text-center text-[10px] outline-none focus:border-blue-500 transition-all disabled:opacity-50 shadow-sm"
                      />
                   </div>
                </div>
             </div>
          )}

          <button 
             onClick={onNext}
             disabled={isPending}
             className={`w-full py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 ${load.step === 7 ? 'bg-slate-900 text-white shadow-slate-200' : isTargetReached || load.step > 1 ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-slate-200 text-slate-500 shadow-slate-100'}`}
          >
             {isPending ? (
               <div className="flex items-center gap-3">
                 <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                 <span>PROCESSANDO...</span>
               </div>
             ) : (
               <>
                 <span className="tracking-[0.15em]">
                   {load.step === 1 ? (isTargetReached ? "FINALIZAR CONTAGEM" : "CONTAGEM EM ANDAMENTO") : 
                    load.step === 5 ? "SALVAR PESO E CONTINUAR" : 
                    load.step === 7 ? "FINALIZAR CARGA" : "CONFIRMAR ETAPA"}
                 </span>
                 <ArrowRight className="w-6 h-6" />
               </>
             )}
          </button>
       </div>
    </div>
  );
};
