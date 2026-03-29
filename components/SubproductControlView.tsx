
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { createSubproductLoad, finalizeSubproductLoad, getActiveBatch } from '../firebase';
import { SubproductLoad, SubproductType } from '../types';
import { 
  Plus, 
  X, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  RefreshCw,
  Package, 
  Minus, 
  ArrowRightLeft,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from './ConfirmModal';
import { Toast, ToastType } from './Toast';

interface SubproductControlViewProps {
  onBack: () => void;
}

const TYPE_MAP: Record<SubproductType, { name: string; color: string; bg: string; border: string; accent: string; logo: string }> = {
  FARELO: { 
    name: 'Farelo de Trigo', 
    color: 'text-stone-800', 
    bg: 'bg-stone-50', 
    border: 'border-stone-200', 
    accent: 'bg-[#4e342e]',
    logo: 'https://i.ibb.co/chcGNGq8/image.png'
  },
  RESIDUO: { 
    name: 'Resíduo', 
    color: 'text-fuchsia-800', 
    bg: 'bg-fuchsia-50', 
    border: 'border-fuchsia-200', 
    accent: 'bg-[#b33a8a]',
    logo: 'https://i.ibb.co/b51GQKNP/image.png'
  },
  OUTRO: { 
    name: 'Outro', 
    color: 'text-slate-700', 
    bg: 'bg-slate-50', 
    border: 'border-slate-200', 
    accent: 'bg-slate-600',
    logo: 'https://i.ibb.co/DgbmXFt0/image.png'
  }
};

export const SubproductControlView: React.FC<SubproductControlViewProps> = ({ onBack }) => {
  const { subproductLoads, stock, batches: allBatches, loadingBatches } = useData();
  const activeBatches = allBatches.filter(b => b.status === 'OPEN');
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState<SubproductLoad | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  // Form State
  const [newType, setNewType] = useState<SubproductType>('FARELO');
  const [newQty, setNewQty] = useState('');
  const [otherName, setOtherName] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [clientName, setClientName] = useState('');

  const formatNumber = (val: string) => {
    // Remove non-numeric characters
    const numeric = val.replace(/\D/g, '');
    if (!numeric) return '';
    // Format with dots for thousands
    return Number(numeric).toLocaleString('pt-BR');
  };

  React.useEffect(() => {
    if (activeBatches.length === 1 && !selectedBatchId) {
      setSelectedBatchId(activeBatches[0].id);
    }
  }, [activeBatches, selectedBatchId]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
  };

  const handleCreate = async () => {
    const normalizedQty = newQty.replace(/\./g, '').replace(',', '.');
    if (!normalizedQty || Number(normalizedQty) <= 0) {
      showToast("Insira uma quantidade válida", "error");
      return;
    }

    setIsProcessing(true);
    
    if (!selectedBatchId) {
      showToast("Selecione um lote para registrar a movimentação.", "error");
      setIsProcessing(false);
      return;
    }

    const selectedBatch = activeBatches.find(b => b.id === selectedBatchId);

    if (!normalizedQty || Number(normalizedQty) <= 0) {
      showToast("Por favor, insira uma quantidade válida.", "error");
      setIsProcessing(false);
      return;
    }

    if (newType === 'OUTRO' && !otherName.trim()) {
      showToast("Por favor, informe o nome do subproduto.", "error");
      setIsProcessing(false);
      return;
    }

    const loadData: any = {
      type: newType,
      quantity: Number(normalizedQty),
      driverName: driverName.trim() || undefined,
      vehiclePlate: vehiclePlate.trim() || undefined,
      client: clientName.trim() || undefined
    };

    if (newType === 'OUTRO') {
      loadData.otherName = otherName;
    }

    const success = await createSubproductLoad(loadData, selectedBatch);

    if (success) {
      showToast("Registro de saída iniciado!", "success");
      setShowAddModal(false);
      setNewQty('');
      setOtherName('');
      setDriverName('');
      setVehiclePlate('');
      setClientName('');
      setSelectedBatchId(activeBatches.length === 1 ? activeBatches[0].id : '');
    } else {
      showToast("Erro ao criar registro. Verifique se há um lote ativo.", "error");
    }
    setIsProcessing(false);
  };

  const handleFinalize = async () => {
    if (!confirmFinalize) return;
    setIsProcessing(true);
    const success = await finalizeSubproductLoad(confirmFinalize.id);
    if (success) {
      showToast("Registro finalizado com sucesso!", "success");
      setConfirmFinalize(null);
    } else {
      showToast("Erro ao finalizar registro.", "error");
    }
    setIsProcessing(false);
  };

  const activeLoads = subproductLoads.filter(l => l.status === 'ATIVO');
  const finalizedLoads = subproductLoads.filter(l => l.status === 'FINALIZADO');

  const branStockKg = stock.branStock || 0;
  const BRAN_CAPACITY = 60000;
  const branPercent = Math.min(Math.round((branStockKg / BRAN_CAPACITY) * 100), 100);

  return (
    <div className="w-full px-4 pb-12 animate-fadeIn font-inter flex flex-col h-full bg-slate-50 min-h-screen">
      {/* Header Fixo */}
      <div className="flex items-center justify-between mb-6 pt-4 sticky top-0 bg-slate-50 z-10 pb-2">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2.5 mr-3 bg-white rounded-xl border border-slate-200 shadow-sm active:scale-95 transition-all text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">Saída Subproduto</h2>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Controle de Saída Industrial</p>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-lg shadow-slate-100 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Novo Registro</span>
        </button>
      </div>

      {/* Caixa de Farelo Status */}
      <div className="mb-8 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-stone-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-stone-100 rounded-lg text-stone-600">
                  <ArrowRightLeft size={14} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caixa de Farelo (Moinho)</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-800 tracking-tighter">{branStockKg.toLocaleString('pt-BR')}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">kg</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black uppercase tracking-widest ${branPercent > 90 ? 'text-red-600 animate-pulse' : 'text-stone-600'}`}>
                {branPercent}% Ocupado
              </span>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Capacidade: 60.000 kg</p>
            </div>
          </div>
          
          <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${branPercent}%` }}
              className={`h-full rounded-full transition-all duration-1000 ${branPercent > 90 ? 'bg-red-500' : 'bg-stone-800 shadow-sm'}`}
            />
          </div>
          
          {branPercent > 85 && (
            <div className="mt-3 flex items-center gap-2 text-red-600">
              <AlertCircle size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Atenção: Caixa atingindo limite máximo!</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Loads */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saídas em Aberto</h3>
           <div className="h-[1px] flex-grow bg-slate-200/60"></div>
           <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full">{activeLoads.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {activeLoads.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center"
              >
                <ArrowRightLeft className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum registro em andamento</p>
              </motion.div>
            ) : activeLoads.map(load => (
              <motion.div 
                key={load.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-[2rem] border ${TYPE_MAP[load.type].border} shadow-xl overflow-hidden group hover:border-emerald-200 transition-all`}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 ${TYPE_MAP[load.type].bg} rounded-2xl flex items-center justify-center border-2 ${TYPE_MAP[load.type].border} overflow-hidden shadow-sm relative group-hover:scale-105 transition-transform bg-white`}>
                        <img 
                          src={TYPE_MAP[load.type].logo} 
                          alt={load.type} 
                          className="w-full h-full object-contain p-2 mb-1"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute bottom-0 left-0 right-0 ${TYPE_MAP[load.type].accent} py-0.5 flex items-center justify-center`}>
                          <span className="text-[7px] font-black text-white uppercase tracking-tighter">
                            {load.type === 'FARELO' ? 'FARELO' : load.type === 'RESIDUO' ? 'RESÍDUO' : 'TRIGO'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-base sm:text-lg font-black text-slate-800 uppercase leading-none mb-1">
                          {load.loadId}
                        </h4>
                        <div className="flex flex-col gap-0.5">
                          <p className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-block ${TYPE_MAP[load.type].bg} ${TYPE_MAP[load.type].color} uppercase tracking-widest w-fit`}>
                            {load.type === 'OUTRO' ? load.otherName : TYPE_MAP[load.type].name}
                          </p>
                          {load.client && (
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-wider">
                              Cliente: {load.client}
                            </p>
                          )}
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
                    <div className="text-right leading-none">
                      <div className="flex items-center gap-1 justify-end text-slate-500">
                        <Clock size={10} />
                        <span className="text-[10px] font-black uppercase">
                          {load.createdAt?.toDate ? new Date(load.createdAt.toDate()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 py-4 px-5 rounded-2xl border border-slate-100 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest mb-0.5">Quantidade</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-black ${TYPE_MAP[load.type].color} tracking-tighter`}>{load.quantity.toLocaleString('pt-BR')}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">kg</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">Status</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ativo
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setConfirmFinalize(load)}
                    className={`w-full py-4 rounded-2xl bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Finalizar Registro
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center gap-3 mb-4 ml-1">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saídas Finalizadas Recentemente</h3>
           <div className="h-[1px] flex-grow bg-slate-200/60"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {finalizedLoads.slice(0, 12).map(load => (
            <div key={load.id} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-100 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${TYPE_MAP[load.type].bg} flex items-center justify-center border ${TYPE_MAP[load.type].border} overflow-hidden bg-white relative`}>
                  <img 
                    src={TYPE_MAP[load.type].logo} 
                    alt={load.type} 
                    className="w-full h-full object-contain p-2 mb-1 opacity-90"
                    referrerPolicy="no-referrer"
                  />
                  <div className={`absolute bottom-0 left-0 right-0 ${TYPE_MAP[load.type].accent} py-0.5 flex items-center justify-center`}>
                    <span className="text-[6px] font-black text-white uppercase tracking-tighter">
                      {load.type === 'FARELO' ? 'FARELO' : load.type === 'RESIDUO' ? 'RESÍDUO' : 'TRIGO'}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">
                    {load.loadId}
                  </h4>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      {load.quantity.toLocaleString('pt-BR')} kg • {load.type === 'OUTRO' ? load.otherName : TYPE_MAP[load.type].name}
                    </p>
                    {load.client && (
                      <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider">
                        Cli: {load.client}
                      </p>
                    )}
                    {(load.driverName || load.vehiclePlate) && (
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight">
                        {load.driverName && `Mot: ${load.driverName}`}
                        {load.driverName && load.vehiclePlate && ' | '}
                        {load.vehiclePlate && `Placa: ${load.vehiclePlate}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {load.updatedAt?.toDate ? new Date(load.updatedAt.toDate()).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--/--'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Adicionar */}
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
              className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 bg-emerald-600 text-white text-center relative">
                <h3 className="text-xl font-black uppercase tracking-widest">Novo Registro de Saída Subproduto</h3>
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
                        onClick={() => setSelectedBatchId(batch.id)}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                          selectedBatchId === batch.id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Package size={14} className={selectedBatchId === batch.id ? 'text-white' : 'text-blue-500'} />
                          <span className="font-black text-[10px] tracking-tight uppercase">{batch.name}</span>
                        </div>
                        {selectedBatchId === batch.id && <CheckCircle2 size={12} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo de Subproduto</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['FARELO', 'RESIDUO', 'OUTRO'] as SubproductType[]).map(t => (
                      <button 
                        key={t} 
                        onClick={() => setNewType(t)} 
                        className={`py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${newType === t ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-100' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {newType === 'OUTRO' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome do Subproduto (Escreva o que desejar)</label>
                    <input 
                      type="text" 
                      value={otherName} 
                      onChange={e => setOtherName(e.target.value.toUpperCase())} 
                      placeholder="DIGITE O NOME DO SUBPRODUTO..."
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all uppercase" 
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Quantidade (KG)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={newQty} 
                    onChange={e => {
                      setNewQty(formatNumber(e.target.value));
                    }} 
                    placeholder="0"
                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all text-lg" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs uppercase">KG</div>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Motorista</label>
                    <input 
                      type="text" 
                      value={driverName} 
                      onChange={e => setDriverName(e.target.value.toUpperCase())} 
                      placeholder="NOME..."
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all uppercase text-[11px]" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Placa</label>
                    <input 
                      type="text" 
                      value={vehiclePlate} 
                      onChange={e => setVehiclePlate(e.target.value.toUpperCase())} 
                      placeholder="ABC-1234"
                      className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all uppercase text-[11px]" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Cliente</label>
                  <input 
                    type="text" 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value.toUpperCase())} 
                    placeholder="NOME DO CLIENTE..."
                    className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all uppercase text-[11px]" 
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-slate-400">Cancelar</button>
                  <button 
                    onClick={handleCreate} 
                    disabled={isProcessing} 
                    className="flex-[2] bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-100 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Iniciar Registro
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
        title="Finalizar Registro"
        message={`Deseja realmente finalizar este registro de ${confirmFinalize?.type === 'OUTRO' ? confirmFinalize.otherName : confirmFinalize?.type}? Ele será contabilizado como saída do moinho.`}
        confirmText="Finalizar"
        variant="primary"
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
