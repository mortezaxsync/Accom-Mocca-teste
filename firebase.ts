
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  Timestamp, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  getDocs,
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  onSnapshot,
  where,
  serverTimestamp,
  increment
} from "firebase/firestore";
// Corrected imports and re-exports
import { Load, LoadType, StockData, Bica, SavedExtraction, MoistureEntry, MillingBoxData, MillingBoxDetails, Destination, CalculatorState, AppConfig, WheatEntry, SubproductLoad, Analysis } from "./types";
import { MillingState } from "./types_umad";

export type { Load, LoadType, StockData, Bica, SavedExtraction, MoistureEntry, MillingBoxData, MillingBoxDetails, Destination, MillingState, CalculatorState, AppConfig, WheatEntry, SubproductLoad, Analysis };

const firebaseConfig = {
  apiKey: "AIzaSyBjWF7a0TR7cYzYELSgFt4Qv8m8Nj_rowY",
  authDomain: "mocca-62337.firebaseapp.com",
  projectId: "mocca-62337",
  storageBucket: "mocca-62337.firebasestorage.app",
  messagingSenderId: "673316672390",
  appId: "1:673316672390:web:f21f0fe220f25d7ea8d207",
  measurementId: "G-VN849CFSVB"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const SHARED_TEAM_ID = "EQUIPE_MOCCA_GERAL";

// --- FUNÇÕES EXTRAÇÃO ---
export const saveExtraction = async (data: any) => {
  try {
    await addDoc(collection(db, "extractions"), {
      userId: SHARED_TEAM_ID,
      flour: data.flourTotal,
      bran: data.bran,
      yieldPercentage: data.yieldPercentage,
      date: Timestamp.now(),
      flourCommon: data.breakdown.common,
      flourSpecial: data.breakdown.special,
      flourWhole: data.breakdown.whole,
      flourGlue: data.breakdown.glue
    });
    return true;
  } catch (error) { return false; }
};

// Updated to accept error callback
export const subscribeToHistory = (onUpdate: (data: SavedExtraction[]) => void, onError?: (error: any) => void) => {
  const q = query(collection(db, "extractions"), orderBy("date", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const history: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === SHARED_TEAM_ID) history.push({ id: doc.id, ...data });
    });
    onUpdate(history);
  }, onError);
};

export const saveAnalysis = async (data: Omit<Analysis, 'id' | 'date' | 'userId'>) => {
  try {
    await addDoc(collection(db, "analyses"), {
      ...data,
      userId: SHARED_TEAM_ID,
      date: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error saving analysis:", error);
    return false;
  }
};

export const subscribeToAnalyses = (onUpdate: (data: Analysis[]) => void, onError?: (error: any) => void) => {
  const q = query(collection(db, "analyses"), orderBy("date", "desc"), limit(50));
  return onSnapshot(q, (snapshot) => {
    const analyses: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === SHARED_TEAM_ID) analyses.push({ id: doc.id, ...data });
    });
    onUpdate(analyses);
  }, onError);
};

// --- FUNÇÕES ESTOQUE ---
export const saveStock = async (data: StockData) => {
  try {
    await setDoc(doc(db, "stock", SHARED_TEAM_ID), { ...data, updatedAt: Timestamp.now(), userId: SHARED_TEAM_ID });
    return true;
  } catch (error) { return false; }
};

export const resetGlueStock = async () => {
  try {
    const docRef = doc(db, "stock", SHARED_TEAM_ID);
    const stockSnap = await getDoc(docRef);
    
    const updates: any = {
      glue: 0,
      updatedAt: serverTimestamp()
    };

    if (stockSnap.exists()) {
      const data = stockSnap.data() as StockData;
      if (data.common < 0) updates.common = 0;
      if (data.special < 0) updates.special = 0;
      if (data.whole < 0) updates.whole = 0;
      if (data.branStock < 0) updates.branStock = 0;
    }

    await updateDoc(docRef, updates);
    return true;
  } catch (error) {
    console.error("Error resetting glue stock:", error);
    return false;
  }
};

// Updated to accept error callback
export const subscribeToStock = (onUpdate: (data: StockData) => void, onError?: (error: any) => void) => {
  const docRef = doc(db, "stock", SHARED_TEAM_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data() as StockData);
    else onUpdate({ common: 0, special: 0, whole: 0, glue: 0, branStock: 0 });
  }, onError);
};

// --- NOVO SISTEMA DE CARGAS ---
export const createLoad = async (loadData: Omit<Load, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'status'>, batchInfo?: { id: string; name: string }) => {
  try {
    const activeBatch = batchInfo || await getActiveBatch();
    if (!activeBatch) return false;

    // Format loadId as #batchName/loadId, ensuring no double #
    const batchPrefix = activeBatch.name.startsWith('#') ? activeBatch.name : `#${activeBatch.name}`;
    const formattedLoadId = `${batchPrefix}/${loadData.loadId}`;

    await addDoc(collection(db, "loads"), {
      ...loadData,
      loadId: formattedLoadId,
      currentQty: loadData.currentQty || 0,
      status: 'ATIVO',
      userId: SHARED_TEAM_ID,
      batchId: activeBatch.id,
      batchName: activeBatch.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) { return false; }
};

export const updateLoadQty = async (id: string, currentQty: number) => {
  try {
    const docRef = doc(db, "loads", id);
    await updateDoc(docRef, {
      currentQty,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) { return false; }
};

export const updateLoadQtyWithStock = async (id: string, newQty: number, type: LoadType, isIncrement: boolean) => {
  if (newQty < 0) return false;
  
  try {
    const docRef = doc(db, "loads", id);
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);
    
    await runTransaction(db, async (transaction) => {
      const loadSnap = await transaction.get(docRef);
      const stockSnap = await transaction.get(stockRef);
      if (!loadSnap.exists()) throw new Error("Load does not exist");
      if (!stockSnap.exists()) throw new Error("Stock does not exist");
      const loadData = loadSnap.data() as Load;

      // Se a carga já passou do passo 5, não permitir alterar a quantidade sem ajustar o estoque
      if (loadData.step >= 6) {
        throw new Error("Cannot update qty of a load already in process (step >= 6)");
      }

      const stockFieldMap: Record<LoadType, keyof StockData> = {
        'E': 'special',
        'C': 'common',
        'I': 'whole',
        'CL': 'glue'
      };
      const field = stockFieldMap[type];
      
      const BRAN_PER_BAG = type === 'CL' ? 314 : 358;
      const change = isIncrement ? 1 : -1;
      const branChange = change * BRAN_PER_BAG;

      const stockData = stockSnap.data() as StockData;
      const currentBran = stockData.branStock || 0;
      const newBran = Math.max(0, currentBran + branChange);
      
      const currentFieldStock = stockData[field] || 0;
      const newFieldStock = Math.max(0, currentFieldStock + change);

      transaction.update(docRef, {
        currentQty: newQty,
        updatedAt: serverTimestamp()
      });

      // Soma no estoque de farinha durante a contagem (Produção)
      // E soma no estoque de farelo
      transaction.update(stockRef, {
        [field]: newFieldStock,
        branStock: newBran,
        updatedAt: serverTimestamp()
      });
    });
    
    return true;
  } catch (error) {
    console.error("Error updating load qty with stock:", error);
    return false;
  }
};

export const updateLoadStep = async (id: string, step: number, extraData?: any) => {
  try {
    const docRef = doc(db, "loads", id);
    
    await runTransaction(db, async (transaction) => {
      const loadSnap = await transaction.get(docRef);
      if (!loadSnap.exists()) throw new Error("Load does not exist");
      
      const loadData = loadSnap.data() as Load;
      
      // Evitar processamento duplicado se já estiver no passo ou à frente
      if (loadData.step >= step && step !== 1) return;

      // Transição crítica: 5 -> 6 (Subtração do estoque global)
      if (loadData.step === 5 && step === 6) {
        const stockRef = doc(db, "stock", SHARED_TEAM_ID);
        const stockSnap = await transaction.get(stockRef);
        const bagsToSubtract = loadData.currentQty || 0;
        
        if (bagsToSubtract > 0 && stockSnap.exists()) {
          const stockData = stockSnap.data() as StockData;
          const stockFieldMap: Record<LoadType, keyof StockData> = {
            'E': 'special',
            'C': 'common',
            'I': 'whole',
            'CL': 'glue'
          };
          const field = stockFieldMap[loadData.type];
          const currentStock = stockData[field] || 0;
          
          // Garantir que o estoque nunca fique negativo
          const newStock = Math.max(0, currentStock - bagsToSubtract);
          
          transaction.update(stockRef, {
            [field]: newStock,
            updatedAt: serverTimestamp()
          });

          // Se houver peso e um lote associado, contabilizar a produção no progresso do lote
          // Usamos o peso vindo do extraData pois o loadData ainda tem o estado antigo
          const weightToUse = extraData?.weight || loadData.weight || 0;
          if (weightToUse > 0 && loadData.batchId) {
            const batchRef = doc(db, "batches", loadData.batchId);
            transaction.update(batchRef, {
              currentFlour: increment(weightToUse),
              updatedAt: serverTimestamp()
            });
          }
        }
      }

      transaction.update(docRef, {
        step,
        updatedAt: serverTimestamp(),
        ...extraData
      });
    });
    
    return true;
  } catch (error) { 
    console.error("Error updating load step:", error);
    return false; 
  }
};

export const finalizeLoad = async (id: string) => {
  try {
    const docRef = doc(db, "loads", id);
    
    // Apenas marcar como FINALIZADO. 
    // O estoque e o progresso do lote já foram atualizados no passo 6.
    await updateDoc(docRef, {
      status: 'FINALIZADO',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) { 
    console.error("Error finalizing load:", error);
    return false; 
  }
};

export const deleteLoad = async (id: string) => {
  try {
    const docRef = doc(db, "loads", id);
    
    await runTransaction(db, async (transaction) => {
      const loadSnap = await transaction.get(docRef);
      if (!loadSnap.exists()) return;
      
      const loadData = loadSnap.data() as Load;
      const stockRef = doc(db, "stock", SHARED_TEAM_ID);
      
      const stockFieldMap: Record<LoadType, keyof StockData> = {
        'E': 'special',
        'C': 'common',
        'I': 'whole',
        'CL': 'glue'
      };
      const field = stockFieldMap[loadData.type];
      const qty = loadData.currentQty || 0;
      const BRAN_PER_BAG = loadData.type === 'CL' ? 314 : 358;

      if (qty > 0) {
        const stockSnap = await transaction.get(stockRef);
        if (stockSnap.exists()) {
          const stockData = stockSnap.data() as StockData;
          const currentBran = stockData.branStock || 0;
          const branToSubtract = qty * BRAN_PER_BAG;
          
          const updates: any = {
            branStock: Math.max(0, currentBran - branToSubtract),
            updatedAt: serverTimestamp()
          };

          if (loadData.step >= 6) {
            // Se a carga já tinha saído (passo >= 6), as bags já foram debitadas do estoque.
            // Ao excluir, devemos devolver essas bags ao estoque (estorno da saída).
            const currentFieldStock = stockData[field] || 0;
            transaction.update(stockRef, {
              [field]: currentFieldStock + qty,
              branStock: Math.max(0, currentBran - branToSubtract),
              updatedAt: serverTimestamp()
            });
          } else {
            // Se a carga ainda não saiu (passo < 6), as bags estão no estoque (somadas na contagem).
            // Ao excluir, removemos as bags (estorno da produção) e o farelo do estoque.
            const currentFieldStock = stockData[field] || 0;
            transaction.update(stockRef, {
              [field]: Math.max(0, currentFieldStock - qty),
              branStock: Math.max(0, currentBran - branToSubtract),
              updatedAt: serverTimestamp()
            });
          }
        }
      }

      // 2. Se a carga já contabilizou no lote (passo >= 6 ou FINALIZADA), remover o peso do progresso do lote
      if ((loadData.status === 'FINALIZADO' || loadData.step >= 6) && loadData.weight && loadData.batchId) {
        const batchRef = doc(db, "batches", loadData.batchId);
        transaction.update(batchRef, {
          currentFlour: increment(-loadData.weight),
          updatedAt: serverTimestamp()
        });
      }
      
      // 3. Excluir a carga
      transaction.delete(docRef);
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting load:", error);
    return false;
  }
};

// Updated to accept error callback
export const subscribeToLoads = (onUpdate: (data: Load[]) => void, onError?: (error: any) => void) => {
  // Remove orderBy from server-side query to avoid documents disappearing during optimistic updates
  const q = query(collection(db, "loads"), where("userId", "==", SHARED_TEAM_ID));
  
  return onSnapshot(q, (snapshot) => {
    const loads: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      loads.push({ id: doc.id, ...data });
    });
    
    // Sort on client side to handle null timestamps during optimistic updates
    loads.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || Date.now();
      const timeB = b.createdAt?.toMillis?.() || Date.now();
      return timeB - timeA;
    });
    
    onUpdate(loads);
  }, onError);
};

// --- OUTRAS FUNÇÕES ---
// Added saveColoration
export const saveColoration = async (bicas: Bica[]) => {
  try {
    await setDoc(doc(db, "coloration", SHARED_TEAM_ID), { bicas, updatedAt: Timestamp.now() });
    return true;
  } catch (error) { return false; }
};

// Updated to accept error callback
export const subscribeToColoration = (onUpdate: (data: Bica[]) => void, onError?: (error: any) => void) => {
  const docRef = doc(db, "coloration", SHARED_TEAM_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data()?.bicas || []);
    else onUpdate([]);
  }, onError);
};

export const saveMillingBox = async (boxId: number, data: MillingBoxData) => {
  try {
    await setDoc(doc(db, "milling", `box_${boxId}`), { ...data, updatedAt: Timestamp.now() });
    return true;
  } catch (error) { return false; }
};

// Updated to accept error callback
export const subscribeToMillingBoxes = (onUpdate: (data: MillingBoxData[]) => void, onError?: (error: any) => void) => {
  const q = query(collection(db, "milling"), orderBy("id", "asc"));
  return onSnapshot(q, (snapshot) => {
    const boxes: any[] = [];
    snapshot.forEach((doc) => boxes.push(doc.data()));
    onUpdate(boxes);
  }, onError);
};

export const saveMoisture = async (wheat: number, flour: number, bran: number) => {
  try {
    await addDoc(collection(db, "moisture"), { userId: SHARED_TEAM_ID, wheat, flour, bran, date: Timestamp.now() });
    return true;
  } catch (error) { return false; }
};

// --- FUNÇÕES UMAD (SINCRONIZAÇÃO) ---
export const saveUmadState = async (state: MillingState) => {
  try {
    await setDoc(doc(db, "umad_config", SHARED_TEAM_ID), { ...state, updatedAt: Timestamp.now() });
    return true;
  } catch (error) { return false; }
};

export const subscribeToUmadState = (onUpdate: (data: MillingState) => void, onError?: (error: any) => void) => {
  const docRef = doc(db, "umad_config", SHARED_TEAM_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data() as MillingState);
  }, onError);
};

// --- FUNÇÕES CALCULADORA (SINCRONIZAÇÃO) ---
export const saveCalculatorState = async (state: CalculatorState) => {
  try {
    await setDoc(doc(db, "calculator_config", SHARED_TEAM_ID), { ...state, updatedAt: Timestamp.now() });
    return true;
  } catch (error) { return false; }
};

export const subscribeToCalculatorState = (onUpdate: (data: CalculatorState) => void, onError?: (error: any) => void) => {
  const docRef = doc(db, "calculator_config", SHARED_TEAM_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data() as CalculatorState);
  }, onError);
};

// --- FUNÇÕES ENTRADA MOEGA ---
export const saveWheatEntry = async (data: Omit<WheatEntry, 'id' | 'date' | 'userId'> & { batchId?: string; batchName?: string; ticket?: string }) => {
  try {
    let batchId = data.batchId;
    let batchName = data.batchName;

    if (!batchId || !batchName) {
      const activeBatch = await getActiveBatch();
      if (!activeBatch) return false;
      batchId = activeBatch.id;
      batchName = activeBatch.name;
    }

    const now = new Date();
    const dayMap = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const dayLetter = dayMap[now.getDay()];
    const dayNumber = now.getDate();
    const generatedId = `T${dayLetter}${dayNumber}`;
    
    const batchPrefix = batchName.startsWith('#') ? batchName : `#${batchName}`;
    const formattedTicketId = `${batchPrefix}/${generatedId}`;

    await addDoc(collection(db, "wheat_entries"), {
      ...data,
      ticket: data.ticket || formattedTicketId,
      userId: SHARED_TEAM_ID,
      batchId: batchId,
      date: serverTimestamp()
    });
    
    // Update batch wheat progress
    await updateBatchProgress(batchId, { wheatAdd: data.liquidWeight });
    
    return true;
  } catch (error) { 
    console.error("Error saving wheat entry:", error);
    return false; 
  }
};

export const deleteWheatEntry = async (entryId: string, batchId: string, weight: number) => {
  try {
    await deleteDoc(doc(db, 'wheat_entries', entryId));
    
    // Subtrair do progresso do lote
    if (batchId) {
      await updateBatchProgress(batchId, { wheatAdd: -weight });
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting wheat entry:", error);
    return false;
  }
};

export const subscribeToWheatEntries = (onUpdate: (data: WheatEntry[]) => void, onError?: (error: any) => void) => {
  const q = query(collection(db, "wheat_entries"), where("userId", "==", SHARED_TEAM_ID));
  
  return onSnapshot(q, (snapshot) => {
    const entries: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({ id: doc.id, ...data });
    });
    
    entries.sort((a, b) => {
      const timeA = a.date?.toMillis?.() || Date.now();
      const timeB = b.date?.toMillis?.() || Date.now();
      return timeB - timeA;
    });
    
    onUpdate(entries);
  }, onError);
};

// --- FUNÇÕES SUBPRODUTOS (SIMILAR AO CONTROLE) ---
export const createSubproductLoad = async (
  data: Omit<SubproductLoad, 'id' | 'loadId' | 'createdAt' | 'updatedAt' | 'userId' | 'status'>,
  activeBatch: any
) => {
  try {
    if (!activeBatch) {
      console.error("No active batch provided for subproduct load");
      return false;
    }

    const now = new Date();
    const dayMap = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const dayLetter = dayMap[now.getDay()];
    const dayNumber = now.getDate();
    
    let prefix = 'O'; // Default for OUTRO
    if (data.type === 'FARELO') prefix = 'F';
    else if (data.type === 'RESIDUO') prefix = 'R';

    const generatedId = `${prefix}${dayLetter}${dayNumber}`;
    const batchPrefix = activeBatch.name.startsWith('#') ? activeBatch.name : `#${activeBatch.name}`;
    const formattedLoadId = `${batchPrefix}/${generatedId}`;

    // Clean data of undefined values for Firestore
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    await addDoc(collection(db, "subproduct_loads"), {
      ...cleanData,
      loadId: formattedLoadId,
      status: 'ATIVO',
      userId: SHARED_TEAM_ID,
      batchId: activeBatch.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) { 
    console.error("Error creating subproduct load:", error);
    return false; 
  }
};

export const finalizeSubproductLoad = async (id: string) => {
  try {
    const docRef = doc(db, "subproduct_loads", id);
    const loadSnap = await getDoc(docRef);
    
    if (loadSnap.exists()) {
      const loadData = loadSnap.data() as SubproductLoad;
      const quantity = loadData.quantity || 0;
      
      await updateDoc(docRef, {
        status: 'FINALIZADO',
        updatedAt: serverTimestamp()
      });

      // Se for farelo, diminui do estoque da caixa
      if (loadData.type === 'FARELO') {
        const stockRef = doc(db, "stock", SHARED_TEAM_ID);
        const stockSnap = await getDoc(stockRef);
        if (stockSnap.exists()) {
          const currentBran = stockSnap.data().branStock || 0;
          const newBran = Math.max(0, currentBran - quantity);
          await updateDoc(stockRef, {
            branStock: newBran,
            updatedAt: serverTimestamp()
          });
        }
      }

      if (loadData.batchId) {
        await updateBatchProgress(loadData.batchId, { subproductAdd: quantity });
      }

      return true;
    }
    return false;
  } catch (error) { return false; }
};

export const subscribeToSubproductLoads = (onUpdate: (data: SubproductLoad[]) => void, onError?: (error: any) => void) => {
  const q = query(collection(db, "subproduct_loads"), where("userId", "==", SHARED_TEAM_ID));
  return onSnapshot(q, (snapshot) => {
    const loads: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      loads.push({ id: doc.id, ...data });
    });
    loads.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || Date.now();
      const timeB = b.createdAt?.toMillis?.() || Date.now();
      return timeB - timeA;
    });
    onUpdate(loads);
  }, onError);
};

// --- FUNÇÕES APP (SINCRONIZAÇÃO) ---
export const saveAppConfig = async (config: AppConfig) => {
  try {
    await setDoc(doc(db, "app_config", SHARED_TEAM_ID), { ...config, updatedAt: Timestamp.now() });
    return true;
  } catch (error) { return false; }
};

export const subscribeToAppConfig = (onUpdate: (data: AppConfig) => void, onError?: (error: any) => void) => {
  const docRef = doc(db, "app_config", SHARED_TEAM_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) onUpdate(docSnap.data() as AppConfig);
  }, onError);
};

// --- FUNÇÕES MOISTURE ---
export const subscribeToMoisture = (onUpdate: (data: MoistureEntry[]) => void, onError?: (error: any) => void) => {
  const q = query(collection(db, "moisture"), orderBy("date", "desc"), limit(20));
  return onSnapshot(q, (snapshot) => {
    const history: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId === SHARED_TEAM_ID) history.push({ id: doc.id, ...data });
    });
    onUpdate(history);
  }, onError);
};

// Added missing config functions
export const isFirebaseReady = () => true;

export const saveFirebaseConfiguration = (config: string) => {
  localStorage.setItem('firebase_config_mocca', config);
  return true;
};

export const resetFirebaseConfiguration = () => {
  localStorage.removeItem('firebase_config_mocca');
  window.location.reload();
};

// --- Batches (Lotes de Produção) ---
export const createBatch = async (data: { name: string; targetWheat: number; millingCapacity: number }) => {
  try {
    const targetFlour = Math.round(data.targetWheat * 0.77);
    const targetSubproduct = Math.round(data.targetWheat * 0.23);
    await addDoc(collection(db, "batches"), {
      ...data,
      targetFlour,
      targetSubproduct,
      currentWheat: 0,
      currentFlour: 0,
      currentSubproduct: 0,
      status: 'OPEN',
      createdAt: serverTimestamp(),
      userId: SHARED_TEAM_ID
    });

    return true;
  } catch (e) {
    console.error("Error creating batch:", e);
    return false;
  }
};

export const updateBatchProgress = async (batchId: string, data: { wheatAdd?: number; flourAdd?: number; subproductAdd?: number }) => {
  try {
    const batchRef = doc(db, "batches", batchId);
    const updates: any = {};
    if (data.wheatAdd) updates.currentWheat = increment(data.wheatAdd);
    if (data.flourAdd) updates.currentFlour = increment(data.flourAdd);
    if (data.subproductAdd) updates.currentSubproduct = increment(data.subproductAdd);
    await updateDoc(batchRef, updates);
    return true;
  } catch (e) {
    console.error("Error updating batch:", e);
    return false;
  }
};

export const closeBatch = async (batchId: string) => {
  try {
    const batchRef = doc(db, "batches", batchId);
    const batchSnap = await getDoc(batchRef);
    if (!batchSnap.exists()) return false;
    
    const batchData = batchSnap.data();
    const startTime = batchData.createdAt?.toDate() || new Date();
    const endTime = new Date();
    
    // Calculate duration
    const diffTime = Math.abs(endTime.getTime() - startTime.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Query wheat entries
    const wheatQ = query(collection(db, "wheat_entries"), where("batchId", "==", batchId));
    const wheatSnap = await getDocs(wheatQ);
    let wheatEntryCount = 0;
    let totalWheat = 0;
    wheatSnap.forEach(doc => {
      wheatEntryCount++;
      totalWheat += doc.data().liquidWeight || 0;
    });
    
    // Query flour loads
    const flourQ = query(collection(db, "loads"), where("batchId", "==", batchId));
    const flourSnap = await getDocs(flourQ);
    let flourLoadCount = 0;
    let totalFlour = 0;
    let totalBags = 0;
    flourSnap.forEach(doc => {
      const data = doc.data();
      flourLoadCount++;
      totalFlour += data.weight || 0;
      totalBags += data.currentQty || 0;
    });
    
    // Query subproduct loads
    const subQ = query(collection(db, "subproduct_loads"), where("batchId", "==", batchId));
    const subSnap = await getDocs(subQ);
    let subproductLoadCount = 0;
    let totalSubproduct = 0;
    subSnap.forEach(doc => {
      subproductLoadCount++;
      totalSubproduct += doc.data().quantity || 0;
    });
    
    await updateDoc(batchRef, {
      status: 'CLOSED',
      closedAt: serverTimestamp(),
      wheatEntryCount,
      currentWheat: totalWheat, // Ensure it's accurate
      flourLoadCount,
      currentFlour: totalFlour, // Ensure it's accurate
      subproductLoadCount,
      currentSubproduct: totalSubproduct, // Ensure it's accurate
      totalBags,
      durationDays
    });
    return true;
  } catch (e) {
    console.error("Error closing batch:", e);
    return false;
  }
};

export const subscribeToBatches = (callback: (batches: any[]) => void, onError?: (error: any) => void) => {
  const q = query(
    collection(db, "batches"), 
    limit(100)
  );
  return onSnapshot(q, (snapshot) => {
    const batches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort client-side to avoid composite index requirement
    batches.sort((a: any, b: any) => {
      const timeA = a.createdAt?.toMillis?.() || Date.now();
      const timeB = b.createdAt?.toMillis?.() || Date.now();
      return timeB - timeA;
    });
    callback(batches);
  }, onError);
};

export const getActiveBatches = async () => {
  const q = query(
    collection(db, "batches"), 
    where("status", "==", "OPEN")
  );
  const snap = await getDocs(q);
  const batches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
  // Sort client-side
  batches.sort((a: any, b: any) => {
    const timeA = a.createdAt?.toMillis?.() || Date.now();
    const timeB = b.createdAt?.toMillis?.() || Date.now();
    return timeB - timeA;
  });
  return batches;
};

export const getActiveBatch = async () => {
  const batches = await getActiveBatches();
  if (batches.length === 0) return null;
  return batches[0];
};

export const saveProductionEntry = async (data: { batchId: string; flourQty: number; branQty: number }) => {
  try {
    await addDoc(collection(db, "production_entries"), {
      ...data,
      createdAt: serverTimestamp()
    });
    // Update batch progress
    await updateBatchProgress(data.batchId, { flourAdd: data.flourQty });
    return true;
  } catch (e) {
    console.error("Error saving production entry:", e);
    return false;
  }
};

export const resetAllData = async () => {
  try {
    // 1. Limpar Cargas (Farinha)
    const loadsSnap = await getDocs(collection(db, "loads"));
    const loadsDeletes = loadsSnap.docs.map(d => deleteDoc(doc(db, "loads", d.id)));
    
    // 2. Limpar Extrações / Histórico
    const extractionsSnap = await getDocs(collection(db, "extractions"));
    const extractionsDeletes = extractionsSnap.docs.map(d => deleteDoc(doc(db, "extractions", d.id)));
    
    // 3. Limpar Umidade
    const moistureSnap = await getDocs(collection(db, "moisture"));
    const moistureDeletes = moistureSnap.docs.map(d => deleteDoc(doc(db, "moisture", d.id)));
    
    // 4. Resetar Estoque
    const stockReset = setDoc(doc(db, "stock", SHARED_TEAM_ID), { 
      common: 0, special: 0, whole: 0, glue: 0, branStock: 0,
      updatedAt: Timestamp.now(), userId: SHARED_TEAM_ID 
    });
    
    // 5. Limpar Moagem (Boxes)
    const millingSnap = await getDocs(collection(db, "milling"));
    const millingDeletes = millingSnap.docs.map(d => deleteDoc(doc(db, "milling", d.id)));

    // 6. Limpar Entrada Trigo (Moega)
    const wheatSnap = await getDocs(collection(db, "wheat_entries"));
    const wheatDeletes = wheatSnap.docs.map(d => deleteDoc(doc(db, "wheat_entries", d.id)));

    // 7. Limpar Lotes (Batches)
    const batchesSnap = await getDocs(collection(db, "batches"));
    const batchesDeletes = batchesSnap.docs.map(d => deleteDoc(doc(db, "batches", d.id)));

    // 8. Limpar Subprodutos
    const subSnap = await getDocs(collection(db, "subproduct_loads"));
    const subDeletes = subSnap.docs.map(d => deleteDoc(doc(db, "subproduct_loads", d.id)));

    // 9. Limpar Lançamentos de Produção
    const prodSnap = await getDocs(collection(db, "production_entries"));
    const prodDeletes = prodSnap.docs.map(d => deleteDoc(doc(db, "production_entries", d.id)));

    // 10. Limpar Coloração
    const colorationReset = setDoc(doc(db, "coloration", SHARED_TEAM_ID), { bicas: [], updatedAt: Timestamp.now() });

    // 11. Resetar Configurações (App, Umad, Calculadora)
    const appConfigReset = setDoc(doc(db, "app_config", SHARED_TEAM_ID), { currentView: 'menu', updatedAt: Timestamp.now() });
    const umadReset = deleteDoc(doc(db, "umad_config", SHARED_TEAM_ID));
    const calcReset = deleteDoc(doc(db, "calculator_config", SHARED_TEAM_ID));

    await Promise.all([
      ...loadsDeletes, 
      ...extractionsDeletes, 
      ...moistureDeletes, 
      ...millingDeletes,
      ...wheatDeletes,
      ...batchesDeletes,
      ...subDeletes,
      ...prodDeletes,
      stockReset,
      colorationReset,
      appConfigReset,
      umadReset,
      calcReset
    ]);
    
    return true;
  } catch (error) {
    console.error("Erro ao resetar dados:", error);
    return false;
  }
};

export const resetActiveLoadsAndStock = async () => {
  try {
    // 1. Zerar todo o estoque de farinha (Comum, Especial, Integral e Cola)
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);
    const stockSnap = await getDoc(stockRef);
    
    if (stockSnap.exists()) {
      await updateDoc(stockRef, {
        common: 0,
        special: 0,
        whole: 0,
        glue: 0,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(stockRef, {
        common: 0,
        special: 0,
        whole: 0,
        glue: 0,
        branStock: 0,
        userId: SHARED_TEAM_ID,
        updatedAt: serverTimestamp()
      });
    }

    // 2. Zerar o contador de TODAS as cargas de farinha que estão em vigor (ATIVO)
    const q = query(
      collection(db, "loads"), 
      where("userId", "==", SHARED_TEAM_ID),
      where("status", "==", "ATIVO")
    );
    
    const querySnapshot = await getDocs(q);
    const updates = querySnapshot.docs.map(d => updateDoc(doc(db, "loads", d.id), { 
      currentQty: 0, 
      updatedAt: serverTimestamp() 
    }));
    
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error("Error resetting loads and stock:", error);
    return false;
  }
};

export const resetStockField = async (field: keyof StockData) => {
  try {
    const stockRef = doc(db, "stock", SHARED_TEAM_ID);
    await updateDoc(stockRef, {
      [field]: 0,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Error resetting stock field ${field}:`, error);
    return false;
  }
};
