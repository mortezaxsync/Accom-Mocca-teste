
import React, { useState } from 'react';
import { Droplets, Palette, Save, History, Clock, CheckCircle2 } from 'lucide-react';
import { saveAnalysis } from '../firebase';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AnalysisControl = () => {
  const { analyses, loadingAnalyses } = useData();
  const [colors, setColors] = useState({
    special: '',
    common: '',
    whole: '',
    glue: ''
  });
  const [humidities, setHumidities] = useState({
    special: '',
    common: '',
    whole: '',
    glue: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveAnalysis({
      colors: {
        special: colors.special.replace(',', '.'),
        common: colors.common.replace(',', '.'),
        whole: colors.whole.replace(',', '.'),
        glue: colors.glue.replace(',', '.')
      },
      humidities: {
        special: parseFloat(humidities.special.replace(',', '.')) || 0,
        common: parseFloat(humidities.common.replace(',', '.')) || 0,
        whole: parseFloat(humidities.whole.replace(',', '.')) || 0,
        glue: parseFloat(humidities.glue.replace(',', '.')) || 0
      }
    });
    if (success) {
      setColors({ special: '', common: '', whole: '', glue: '' });
      setHumidities({ special: '', common: '', whole: '', glue: '' });
    }
    setIsSaving(false);
  };

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    id: string,
    value: string
  ) => {
    // Allow only numbers, commas and dots
    const sanitized = value.replace(/[^0-9.,]/g, '');
    setter((prev: any) => ({ ...prev, [id]: sanitized }));
  };

  const flourTypes = [
    { id: 'special', label: 'ESPECIAL', color: 'text-blue-700', bg: 'bg-blue-50/50', border: 'border-blue-200', accent: 'bg-blue-600', icon: <Palette size={20} /> },
    { id: 'common', label: 'COMUM', color: 'text-emerald-700', bg: 'bg-emerald-50/50', border: 'border-emerald-200', accent: 'bg-emerald-600', icon: <Palette size={20} /> },
    { id: 'whole', label: 'INTEIRA', color: 'text-amber-700', bg: 'bg-amber-50/50', border: 'border-amber-200', accent: 'bg-amber-600', icon: <Palette size={20} /> },
    { id: 'glue', label: 'COLA', color: 'text-slate-700', bg: 'bg-slate-50/50', border: 'border-slate-200', accent: 'bg-slate-800', icon: <Palette size={20} /> }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-6 mb-10">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Análise de Qualidade</h2>
              <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-wider">Laboratório de Controle de Pureza</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {flourTypes.map(type => (
              <div 
                key={type.id} 
                className={`p-6 rounded-2xl border ${type.border} ${type.bg} transition-all hover:shadow-md group`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-10 h-10 ${type.accent} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                    {type.icon}
                  </div>
                  <h3 className={`text-xl font-bold uppercase tracking-tight ${type.color}`}>{type.label}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={`text-[11px] font-bold ${type.color} uppercase tracking-wider ml-1`}>
                      Cor (L*)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={colors[type.id as keyof typeof colors]}
                        onChange={(e) => handleInputChange(setColors, type.id, e.target.value)}
                        placeholder="90,47"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-900 placeholder:text-slate-300"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px] uppercase">L*</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Umidade (%)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={humidities[type.id as keyof typeof humidities]}
                        onChange={(e) => handleInputChange(setHumidities, type.id, e.target.value)}
                        placeholder="14,2"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold text-slate-900 placeholder:text-slate-300"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[10px] uppercase">%</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-8 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] uppercase text-sm tracking-widest"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Registrando...' : 'Salvar Análise'}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-slate-100 rounded-xl">
            <History className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Histórico de Análises</h3>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">Registros Recentes</p>
          </div>
        </div>

        <div className="space-y-4">
          {loadingAnalyses ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando...</span>
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum registro</span>
            </div>
          ) : (
            analyses.map((analysis) => (
              <div key={analysis.id} className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-slate-300 transition-all shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <Clock className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">
                        {analysis.date?.toDate ? format(analysis.date.toDate(), "dd 'de' MMMM, yyyy", { locale: ptBR }) : '---'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {analysis.date?.toDate ? format(analysis.date.toDate(), "HH:mm", { locale: ptBR }) : '---'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Validado</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {flourTypes.map(type => (
                    <div key={type.id} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2 h-2 ${type.accent} rounded-full`} />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{type.label}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Cor</span>
                          <span className="text-lg font-bold text-slate-900">{analysis.colors?.[type.id] || '---'}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Umi.</span>
                          <span className="text-lg font-bold text-slate-900">{analysis.humidities?.[type.id] ? `${analysis.humidities[type.id]}%` : '---'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisControl;
