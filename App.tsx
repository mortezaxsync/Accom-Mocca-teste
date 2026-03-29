
import React, { useState, useEffect, ErrorInfo, ReactNode, Component, useRef } from 'react';
import { Logo } from './components/Logo';
import { SplashScreen } from './components/SplashScreen';
import { DataProvider } from './contexts/DataContext';
import { saveAppConfig, subscribeToAppConfig } from './firebase';
import { Sidebar } from './components/Sidebar';
import { Menu, X, Bell, User, Search, LayoutGrid, Maximize2, Settings, Plus, Minus, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAudioAlerts } from './src/hooks/useAudioAlerts';

// --- Importações ---
import { Calculator } from './components/Calculator';
import { HistoryView } from './components/HistoryView';
import { HomeMenu } from './components/HomeMenu';
import { FlourStockView } from './components/FlourStockView';
import { FlourStockControl } from './components/FlourStockControl';
import { ColorationView } from './components/ColorationView';
import { UmadView } from './components/UmadView';
import { MaintenanceView } from './components/MaintenanceView';
import { WheatEntryView } from './components/WheatEntryView';
import { ReportsView } from './components/ReportsView';
import { IndustrialControlView } from './components/IndustrialControlView';
import { SubproductControlView } from './components/SubproductControlView';
import { ProductionBatchView } from './components/ProductionBatchView';
import { SearchView } from './components/SearchView';
import { BackupView } from './components/BackupView';
import AnalysisControl from './components/AnalysisControl';

// --- Error Boundary ---
interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState;
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState { 
    return { hasError: true, error }; 
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) { 
    console.error("Uncaught error:", error, errorInfo); 
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
          <div className="bg-red-50 p-10 rounded-[2rem] border border-red-100 max-w-md w-full shadow-xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X size={32} />
            </div>
            <h2 className="text-2xl font-black text-red-900 mb-2 uppercase tracking-tight">Erro de Sistema</h2>
            <p className="text-red-700/70 text-[10px] font-black mb-8 uppercase tracking-[0.2em]">Ocorreu um problema inesperado ao carregar este módulo.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em]"
            >
              Reiniciar Aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type ViewState = 'menu' | 'stock-view' | 'stock-control' | 'maintenance' | 'wheat-entry' | 'reports' | 'industrial-control' | 'subproducts' | 'production-batch' | 'backup' | 'analysis';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [zoom, setZoom] = useState(Number(localStorage.getItem('app_zoom') || 1));
  const [activeAlert, setActiveAlert] = useState<{ title: string; message: string } | null>(null);
  const isRemoteUpdate = useRef(false);

  useAudioAlerts((title, message) => {
    setActiveAlert({ title, message });
    // Auto-close after 10 seconds if not clicked
    setTimeout(() => {
      setActiveAlert(prev => (prev?.title === title ? null : prev));
    }, 10000);
  });

  useEffect(() => {
    localStorage.setItem('app_zoom', zoom.toString());
  }, [zoom]);

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 7000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsub = subscribeToAppConfig((config) => {
      if (config.currentView) {
        isRemoteUpdate.current = true;
        setCurrentView(config.currentView as ViewState);
        setTimeout(() => { isRemoteUpdate.current = false; }, 100);
      }
    });

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!isRemoteUpdate.current) {
      saveAppConfig({ currentView });
    }
  }, [currentView]);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView('menu'); 
  };

  const renderContent = () => {
    const SafeRender = (Component: React.ElementType) => (
      <ErrorBoundary>
         <Component 
          onBack={handleBack} 
          onNavigate={handleNavigate} 
        />
      </ErrorBoundary>
    );

    switch (currentView) {
      case 'stock-view': return SafeRender(FlourStockView);
      case 'stock-control': return SafeRender(FlourStockControl);
      case 'maintenance': return SafeRender(MaintenanceView);
      case 'wheat-entry': return SafeRender(WheatEntryView);
      case 'reports': return SafeRender(ReportsView);
      case 'industrial-control': return SafeRender(IndustrialControlView);
      case 'subproducts': return SafeRender(SubproductControlView);
      case 'production-batch': return SafeRender(ProductionBatchView);
      case 'backup': return SafeRender(BackupView);
      case 'analysis': return SafeRender(AnalysisControl);
      case 'menu':
      default: return SafeRender(HomeMenu);
    }
  };

  return (
    <DataProvider>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-[200]"
          >
            <SplashScreen />
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="min-h-screen bg-slate-50 font-inter text-slate-800 flex overflow-hidden"
        style={{ zoom: zoom }}
      >
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-black text-center py-1.5 z-[100] uppercase tracking-[0.3em] shadow-lg">
            ⚠️ Sistema em Modo Offline - Dados Locais Apenas
          </div>
        )}

        {/* Sidebar */}
        <Sidebar 
          currentView={currentView} 
          onNavigate={handleNavigate} 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
        />

        {/* Main Content Area */}
        <main className={`flex-grow flex flex-col transition-all duration-300 ease-in-out bg-[#F8FAFC] ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          
          {/* View Content */}
          <div className="flex-grow overflow-y-auto p-4 sm:p-8 lg:p-10 bg-slate-50/50">
            <div className="max-w-7xl mx-auto h-full">
              {renderContent()}
            </div>
          </div>

          <AnimatePresence>
            {searchOpen && (
              <SearchView 
                onClose={() => setSearchOpen(false)} 
                onNavigate={handleNavigate} 
              />
            )}
          </AnimatePresence>

          {/* Zoom Controls */}
          <div className="fixed bottom-20 right-8 flex flex-col gap-2 z-[90]">
            <button 
              onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
              title="Aumentar Zoom"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
              title="Diminuir Zoom"
            >
              <Minus size={20} />
            </button>
            <button 
              onClick={() => setZoom(1)}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center justify-center text-[10px] font-black text-slate-400 hover:bg-slate-50 active:scale-95 transition-all"
              title="Resetar Zoom"
            >
              100%
            </button>
          </div>

          {/* Alert Modal */}
          <AnimatePresence>
            {activeAlert && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-sm w-full p-8 text-center relative overflow-hidden"
                >
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    {activeAlert.title}
                  </h2>
                  <p className="text-slate-500 text-[10px] font-black mb-8 uppercase tracking-[0.2em] leading-relaxed">
                    {activeAlert.message}
                  </p>
                  <button 
                    onClick={() => setActiveAlert(null)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-xl shadow-lg shadow-blue-100 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em]"
                  >
                    Entendi
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <footer className="h-14 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>MOCCA MOINHO COMERCIAL &copy; {new Date().getFullYear()}</span>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Servidor Conectado
              </span>
              <span>v2.4.0-PC</span>
            </div>
          </footer>
        </main>
      </div>
    </DataProvider>
  );
};

export default App;
