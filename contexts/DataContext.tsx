
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  subscribeToHistory, 
  subscribeToStock, 
  subscribeToColoration,
  subscribeToWheatEntries,
  subscribeToSubproductLoads,
  subscribeToLoads,
  subscribeToBatches,
  subscribeToAnalyses
} from '../firebase';
import { SavedExtraction, StockData, Bica, WheatEntry, SubproductLoad, Load, Batch, Analysis } from '../types';

interface DataContextType {
  history: SavedExtraction[];
  stock: StockData;
  coloration: Bica[];
  wheatEntries: WheatEntry[];
  subproductLoads: SubproductLoad[];
  loads: Load[];
  batches: Batch[];
  analyses: Analysis[];
  loadingHistory: boolean;
  loadingStock: boolean;
  loadingColoration: boolean;
  loadingWheat: boolean;
  loadingSubproducts: boolean;
  loadingLoads: boolean;
  loadingBatches: boolean;
  loadingAnalyses: boolean;
}

const DataContext = createContext<DataContextType>({
  history: [],
  stock: { common: 0, special: 0, whole: 0, glue: 0 },
  coloration: [],
  wheatEntries: [],
  subproductLoads: [],
  loads: [],
  batches: [],
  analyses: [],
  loadingHistory: true,
  loadingStock: true,
  loadingColoration: true,
  loadingWheat: true,
  loadingSubproducts: true,
  loadingLoads: true,
  loadingBatches: true,
  loadingAnalyses: true,
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<SavedExtraction[]>([]);
  const [stock, setStock] = useState<StockData>({ common: 0, special: 0, whole: 0, glue: 0 });
  const [coloration, setColoration] = useState<Bica[]>([]);
  const [wheatEntries, setWheatEntries] = useState<WheatEntry[]>([]);
  const [subproductLoads, setSubproductLoads] = useState<SubproductLoad[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingColoration, setLoadingColoration] = useState(true);
  const [loadingWheat, setLoadingWheat] = useState(true);
  const [loadingSubproducts, setLoadingSubproducts] = useState(true);
  const [loadingLoads, setLoadingLoads] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);

  useEffect(() => {
    const unsubHistory = subscribeToHistory(
      (data) => {
        setHistory(data);
        setLoadingHistory(false);
      },
      (error) => {
        console.error("Falha histórico:", error);
        setLoadingHistory(false);
      }
    );

    const unsubStock = subscribeToStock(
      (data) => {
        setStock(data);
        setLoadingStock(false);
      },
      (error) => {
        console.error("Falha estoque:", error);
        setLoadingStock(false);
      }
    );

    const unsubColoration = subscribeToColoration(
      (data) => {
        setColoration(data);
        setLoadingColoration(false);
      },
      (error) => {
        console.error("Falha coloração:", error);
        setColoration([]);
        setLoadingColoration(false);
      }
    );

    const unsubWheat = subscribeToWheatEntries(
      (data) => {
        setWheatEntries(data);
        setLoadingWheat(false);
      },
      (error) => {
        console.error("Falha entradas trigo:", error);
        setLoadingWheat(false);
      }
    );

    const unsubSubproducts = subscribeToSubproductLoads(
      (data) => {
        setSubproductLoads(data);
        setLoadingSubproducts(false);
      },
      (error) => {
        console.error("Falha subprodutos:", error);
        setLoadingSubproducts(false);
      }
    );

    const unsubLoads = subscribeToLoads(
      (data) => {
        setLoads(data);
        setLoadingLoads(false);
      },
      (error) => {
        console.error("Falha cargas:", error);
        setLoadingLoads(false);
      }
    );

    const unsubBatches = subscribeToBatches(
      (data) => {
        setBatches(data);
        setLoadingBatches(false);
      },
      (error) => {
        console.error("Falha lotes:", error);
        setLoadingBatches(false);
      }
    );

    const unsubAnalyses = subscribeToAnalyses(
      (data) => {
        setAnalyses(data);
        setLoadingAnalyses(false);
      },
      (error) => {
        console.error("Falha análises:", error);
        setLoadingAnalyses(false);
      }
    );

    return () => {
      unsubHistory();
      unsubStock();
      unsubColoration();
      unsubWheat();
      unsubSubproducts();
      unsubLoads();
      unsubBatches();
      unsubAnalyses();
    };
  }, []);

  return (
    <DataContext.Provider value={{ 
      history, 
      stock, 
      coloration,
      wheatEntries,
      subproductLoads,
      loads,
      batches,
      analyses,
      loadingHistory, 
      loadingStock, 
      loadingColoration, 
      loadingWheat,
      loadingSubproducts,
      loadingLoads,
      loadingBatches,
      loadingAnalyses
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
