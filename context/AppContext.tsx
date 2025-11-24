import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, Session, User, PatientStatus, Periodicity, SessionStatus } from '../types';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, setHours, setMinutes, isBefore, addDays, startOfWeek } from 'date-fns';
import { 
  auth, 
  googleProvider, 
  db 
} from '../services/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  setDoc
} from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  sendVerificationCode: (contact: string) => Promise<boolean>;
  verifyAndRegister: (code: string, userData: { name: string; contact: string; type: 'EMAIL' | 'PHONE' }) => Promise<boolean>;
  patients: Patient[];
  sessions: Session[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatient: (patient: Patient) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  generateMonthlySessions: (year: number, month: number) => void;
  syncGoogleCalendar: () => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper para Demo Mode (Local)
const STORAGE_KEY_PATIENTS_DEMO = 'psico_agenda_patients_demo';
const STORAGE_KEY_SESSIONS_DEMO = 'psico_agenda_sessions_demo';

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 1. Observer de Autenticação do Firebase
  useEffect(() => {
    // Check if auth service is available (it might be undefined if keys are missing)
    if (!auth) {
      console.log("Firebase Auth not initialized. App will default to signed-out state.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Usuário logado via Firebase
        const appUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Doutor(a)',
          email: firebaseUser.email || undefined,
          avatarUrl: firebaseUser.photoURL || undefined
        };
        setUser(appUser);
        setIsDemoMode(false);
      } else {
        // Se não houver user Firebase, verifica se estamos no modo demo manual
        if (!isDemoMode) {
            setUser(null);
            setPatients([]);
            setSessions([]);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  // 2. Observer de Dados (Firestore ou LocalStorage Demo)
  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      // --- Lógica Demo (LocalStorage) ---
      const storedPatients = localStorage.getItem(STORAGE_KEY_PATIENTS_DEMO);
      const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS_DEMO);
      if (storedPatients) setPatients(JSON.parse(storedPatients));
      if (storedSessions) setSessions(JSON.parse(storedSessions));
    } else {
      // --- Lógica Real (Firestore) ---
      if (!db) {
         console.warn("Firestore not available.");
         return;
      }

      // Listener de Pacientes
      const qPatients = query(collection(db, "patients"), where("userId", "==", user.id));
      const unsubPatients = onSnapshot(qPatients, (snapshot) => {
        const loadedPatients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Patient[];
        setPatients(loadedPatients);
      });

      // Listener de Sessões
      const qSessions = query(collection(db, "sessions"), where("userId", "==", user.id));
      const unsubSessions = onSnapshot(qSessions, (snapshot) => {
        const loadedSessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Session[];
        setSessions(loadedSessions);
      });

      return () => {
        unsubPatients();
        unsubSessions();
      };
    }
  }, [user, isDemoMode]);

  // Salva dados Demo no LocalStorage quando mudam
  useEffect(() => {
    if (isDemoMode && !loading) {
      localStorage.setItem(STORAGE_KEY_PATIENTS_DEMO, JSON.stringify(patients));
      localStorage.setItem(STORAGE_KEY_SESSIONS_DEMO, JSON.stringify(sessions));
    }
  }, [patients, sessions, loading, isDemoMode]);

  // --- Helpers de Demo ---
  const generateDemoData = () => {
      const firstNames = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Hugo", "Isabela", "João", "Karina", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro", "Quintino", "Rafaela", "Samuel", "Tatiana"];
      const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"];

      const demoPatients: Patient[] = firstNames.map((name, index) => {
        const isBiweekly = index < 3;
        const baseValue = 150 + Math.floor(Math.random() * 11) * 10;
        const dayOfWeek = (index % 5) + 1;
        
        return {
          id: crypto.randomUUID(),
          name: `${name} ${lastNames[index]}`,
          email: `${name.toLowerCase()}@exemplo.com`,
          phone: `(11) 9${Math.floor(Math.random()*10000)}-${Math.floor(Math.random()*10000)}`,
          birthDate: '1990-01-01',
          valuePerSession: baseValue,
          periodicity: isBiweekly ? Periodicity.BIWEEKLY : Periodicity.WEEKLY,
          dayOfWeek: dayOfWeek,
          status: PatientStatus.ACTIVE,
          notes: `Paciente Demo.`,
          requiresReceipt: Math.random() > 0.5
        };
      });

      const today = new Date();
      const start = startOfMonth(today);
      const end = endOfMonth(today);
      const daysInMonth = eachDayOfInterval({ start, end });
      const demoSessions: Session[] = [];

      demoPatients.forEach(patient => {
        const patientDays = daysInMonth.filter(day => getDay(day) === patient.dayOfWeek);
        patientDays.forEach((day, index) => {
          let shouldSchedule = false;
          if (patient.periodicity === Periodicity.WEEKLY) shouldSchedule = true;
          if (patient.periodicity === Periodicity.BIWEEKLY) shouldSchedule = index % 2 === 0;

          if (shouldSchedule) {
            const sessionDate = setMinutes(setHours(day, 9 + (index % 8)), 0);
            const isPast = isBefore(sessionDate, today);
            let status = SessionStatus.SCHEDULED;
            let paid = false;

            if (isPast) {
              const rand = Math.random();
              if (rand > 0.2) status = SessionStatus.COMPLETED;
              else if (rand > 0.1) status = SessionStatus.PATIENT_ABSENT;
              else status = SessionStatus.CANCELLED;

              if (status === SessionStatus.COMPLETED && Math.random() > 0.3) paid = true;
            }

            demoSessions.push({
              id: crypto.randomUUID(),
              patientId: patient.id,
              date: sessionDate.toISOString(),
              status: status,
              paid: paid,
              valueSnapshot: patient.valuePerSession
            });
          }
        });
      });

      return { demoPatients, demoSessions };
  };

  // --- Ações de Auth ---

  const login = async (email: string, password?: string) => {
    // Demo Bypass
    if (email === 'teste@teste.com' && password === '123456') {
      setIsDemoMode(true);
      const { demoPatients, demoSessions } = generateDemoData();
      setUser({ id: 'demo-user', name: 'Dr. Demonstração', email });
      setPatients(demoPatients);
      setSessions(demoSessions);
      return;
    }

    // Firebase Auth
    if (!password) throw new Error("Senha necessária");
    
    if (!auth) throw new Error("Serviço de autenticação não configurado.");

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        throw new Error(error.message);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Serviço de autenticação não configurado.");
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
        console.error("Erro Login Google", error);
        throw new Error("Erro ao conectar com Google: " + error.message);
    }
  };

  const logout = () => {
    if (isDemoMode) {
        setIsDemoMode(false);
        setUser(null);
    } else {
        if (auth) signOut(auth);
    }
  };

  const sendVerificationCode = async (contact: string): Promise<boolean> => {
    // Simulação para o fluxo de cadastro
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockCode = "123456";
        alert(`[SIMULAÇÃO FIREBASE] Código enviado para ${contact}: ${mockCode}`);
        resolve(true);
      }, 1000);
    });
  };

  const verifyAndRegister = async (code: string, userData: { name: string; contact: string; type: 'EMAIL' | 'PHONE' }): Promise<boolean> => {
    if (code !== "123456") return false;

    // Criar usuário no Firebase
    if (userData.type === 'EMAIL') {
        try {
            if (!auth) throw new Error("Serviço de autenticação não configurado.");
            // Cria usuário com senha padrão temporária para este fluxo simplificado
            const userCredential = await createUserWithEmailAndPassword(auth, userData.contact, "123456");
            await updateProfile(userCredential.user, { displayName: userData.name });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    return true; 
  };

  // --- CRUD (Firestore ou Demo) ---

  const addPatient = async (patientData: Omit<Patient, 'id'>) => {
    if (isDemoMode) {
      const newPatient = { ...patientData, id: crypto.randomUUID() };
      setPatients(prev => [...prev, newPatient]);
      return;
    }

    if (!user || !db) return;
    try {
        await addDoc(collection(db, 'patients'), {
            ...patientData,
            userId: user.id
        });
    } catch (e) {
        console.error("Erro ao adicionar paciente", e);
    }
  };

  const updatePatient = async (patient: Patient) => {
    if (isDemoMode) {
      setPatients(prev => prev.map(p => p.id === patient.id ? patient : p));
      return;
    }
    if (!db) return;
    try {
        const { id, ...data } = patient;
        await updateDoc(doc(db, 'patients', id), data);
    } catch (e) { console.error(e); }
  };

  const addSession = async (session: Session) => {
    if (isDemoMode) {
       setSessions(prev => [...prev, session]);
       return;
    }
    if (!user || !db) return;
    try {
        // Remover ID se vier (Firestore cria)
        const { id, ...data } = session;
        await addDoc(collection(db, 'sessions'), {
            ...data,
            userId: user.id
        });
    } catch (e) { console.error(e); }
  };

  const updateSession = async (session: Session) => {
    if (isDemoMode) {
       setSessions(prev => prev.map(s => s.id === session.id ? session : s));
       return;
    }
    if (!db) return;
    try {
        const { id, ...data } = session;
        await updateDoc(doc(db, 'sessions', id), data);
    } catch (e) { console.error(e); }
  };

  const removeSession = async (sessionId: string) => {
    if (isDemoMode) {
       setSessions(prev => prev.filter(s => s.id !== sessionId));
       return;
    }
    if (!db) return;
    try {
        await deleteDoc(doc(db, 'sessions', sessionId));
    } catch (e) { console.error(e); }
  };

  const generateMonthlySessions = (year: number, month: number) => {
    // Lógica compartilhada: Gera objetos e chama addSession
    
    // Simplificação: Apenas gera se não tiver sessões no mês para aquele paciente
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    const daysInMonth = eachDayOfInterval({ start, end });

    patients.forEach(patient => {
      if (patient.status !== PatientStatus.ACTIVE) return;
      if (patient.periodicity === Periodicity.SINGLE) return;
      if (patient.dayOfWeek === undefined) return;

      const patientDays = daysInMonth.filter(day => getDay(day) === patient.dayOfWeek);

      patientDays.forEach((day, index) => {
        let shouldSchedule = false;
        if (patient.periodicity === Periodicity.WEEKLY) shouldSchedule = true;
        if (patient.periodicity === Periodicity.BIWEEKLY) shouldSchedule = index % 2 === 0;
        if (patient.periodicity === Periodicity.MONTHLY) shouldSchedule = index === 0;

        if (shouldSchedule) {
          const dateStr = format(day, 'yyyy-MM-dd');
          // Verifica em memória (o listener do Firestore mantém 'sessions' atualizado)
          const exists = sessions.some(s => s.patientId === patient.id && s.date.startsWith(dateStr));

          if (!exists) {
            const sessionDate = setMinutes(setHours(day, 10), 0);
            addSession({
              id: 'temp', // Firestore vai gerar
              patientId: patient.id,
              date: sessionDate.toISOString(),
              status: SessionStatus.SCHEDULED,
              paid: false,
              valueSnapshot: patient.valuePerSession
            });
          }
        }
      });
    });
  };

  const syncGoogleCalendar = () => {
    // Mock implementation for UI consistency
    const today = new Date();
    const startOfWeekDate = startOfWeek(today);
    for (let i = 0; i < 3; i++) {
        const eventDate = addDays(startOfWeekDate, i + 2); 
        setHours(eventDate, 15);
        setMinutes(eventDate, 0);
        addSession({
            id: 'temp',
            patientId: 'unmatched',
            date: eventDate.toISOString(),
            status: SessionStatus.UNCONFIRMED,
            paid: false,
            valueSnapshot: 0,
            importedName: 'Evento Google Importado'
        });
    }
    alert("Sincronização simulada realizada (integração real requer Cloud Functions).");
  };

  return (
    <AppContext.Provider value={{ 
      user, login, loginWithGoogle, logout, 
      sendVerificationCode, verifyAndRegister,
      patients, sessions, 
      addPatient, updatePatient, 
      addSession, updateSession, removeSession,
      generateMonthlySessions, syncGoogleCalendar,
      loading 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
