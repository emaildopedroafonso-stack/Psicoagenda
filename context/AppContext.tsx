import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, Session, User, PatientStatus, Periodicity, SessionStatus } from '../types';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, setHours, setMinutes, isBefore, isAfter, addDays, startOfWeek } from 'date-fns';

interface AppContextType {
  user: User | null;
  login: (email: string, password?: string) => void;
  loginWithGoogle: () => void;
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

// Mock Data persistence helper
const STORAGE_KEY_PATIENTS = 'psico_agenda_patients';
const STORAGE_KEY_SESSIONS = 'psico_agenda_sessions';
const STORAGE_KEY_USER = 'psico_agenda_user';

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from local storage on mount
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    const storedPatients = localStorage.getItem(STORAGE_KEY_PATIENTS);
    const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedPatients) setPatients(JSON.parse(storedPatients));
    if (storedSessions) setSessions(JSON.parse(storedSessions));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(patients));
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    }
  }, [patients, sessions, loading]);

  const generateDemoData = () => {
    const firstNames = [
      "Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Hugo", 
      "Isabela", "João", "Karina", "Lucas", "Mariana", "Nicolas", "Olivia", 
      "Pedro", "Quintino", "Rafaela", "Samuel", "Tatiana"
    ];
    const lastNames = [
      "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", 
      "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", 
      "Almeida", "Lopes", "Soares", "Fernandes", "Vieira", "Barbosa"
    ];

    const demoPatients: Patient[] = firstNames.map((name, index) => {
      const isBiweekly = index < 3; // First 3 are biweekly
      const lastName = lastNames[index];
      const fullName = `${name} ${lastName}`;
      const baseValue = 150 + Math.floor(Math.random() * 11) * 10; // 150 to 250 step 10
      const dayOfWeek = (index % 5) + 1; // 1 (Mon) to 5 (Fri)
      const startYear = 2020 + Math.floor(Math.random() * 4);
      
      return {
        id: crypto.randomUUID(),
        name: fullName,
        email: `${name.toLowerCase()}.${lastName.toLowerCase()}@exemplo.com`,
        phone: `(11) 9${Math.floor(Math.random()*10000)}-${Math.floor(Math.random()*10000)}`,
        birthDate: `${1970 + Math.floor(Math.random() * 30)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        valuePerSession: baseValue,
        periodicity: isBiweekly ? Periodicity.BIWEEKLY : Periodicity.WEEKLY,
        dayOfWeek: dayOfWeek,
        status: PatientStatus.ACTIVE,
        notes: `Paciente iniciou terapia em ${startYear}. Queixa principal: Ansiedade e estresse no trabalho.`,
        requiresReceipt: Math.random() > 0.5 // 50% chance of needing receipt
      };
    });

    // Generate sessions for the current month based on these patients
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
          const sessionDate = setMinutes(setHours(day, 9 + (index % 8)), 0); // Random hour 9-17
          const isPast = isBefore(sessionDate, today);
          
          let status = SessionStatus.SCHEDULED;
          let paid = false;

          if (isPast) {
            // 80% chance of completed, 10% patient absent, 10% cancelled
            const rand = Math.random();
            if (rand > 0.2) status = SessionStatus.COMPLETED;
            else if (rand > 0.1) status = SessionStatus.PATIENT_ABSENT;
            else status = SessionStatus.CANCELLED;

            // If completed, 70% chance it's already paid
            if (status === SessionStatus.COMPLETED && Math.random() > 0.3) {
              paid = true;
            }
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

  const login = (email: string, password?: string) => {
    // Check for demo account
    if (email === 'teste@teste.com' && password === '123456') {
      const { demoPatients, demoSessions } = generateDemoData();
      
      const newUser = { id: 'demo-user', name: 'Dr. Demonstração', email };
      setUser(newUser);
      setPatients(demoPatients);
      setSessions(demoSessions);
      
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_PATIENTS, JSON.stringify(demoPatients));
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(demoSessions));
      
      return;
    }

    // Normal mock login
    const newUser = { id: '1', name: 'Dr. Psicólogo', email };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  };

  const loginWithGoogle = () => {
    // Simulated Google Login
    const newUser = { 
        id: 'google-user-123', 
        name: 'Psicólogo Google', 
        email: 'psico.google@gmail.com',
        avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c' // Mock avatar
    };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
    
    // Optional: Generate some dummy data if empty
    if (patients.length === 0) {
        const { demoPatients, demoSessions } = generateDemoData();
        setPatients(demoPatients);
        setSessions(demoSessions);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  // --- Funções de Cadastro Simulado ---

  const sendVerificationCode = async (contact: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Em um app real, aqui chamaria a API para enviar SMS ou Email
        // Como é uma demo, mostramos um alerta com o código
        const mockCode = "123456";
        alert(`[SIMULAÇÃO] Seu código de verificação para ${contact} é: ${mockCode}`);
        resolve(true);
      }, 1500);
    });
  };

  const verifyAndRegister = async (code: string, userData: { name: string; contact: string; type: 'EMAIL' | 'PHONE' }): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (code === "123456") {
                const newUser: User = {
                    id: crypto.randomUUID(),
                    name: userData.name,
                    email: userData.type === 'EMAIL' ? userData.contact : undefined,
                    phone: userData.type === 'PHONE' ? userData.contact : undefined
                };
                
                setUser(newUser);
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
                
                // Inicializa com dados vazios para novo usuário
                setPatients([]);
                setSessions([]);
                
                resolve(true);
            } else {
                resolve(false);
            }
        }, 1000);
    });
  };

  // ------------------------------------

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = { ...patientData, id: crypto.randomUUID() };
    setPatients(prev => [...prev, newPatient]);
  };

  const updatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const addSession = (session: Session) => {
    setSessions(prev => [...prev, session]);
  };

  const updateSession = (updatedSession: Session) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const removeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const generateMonthlySessions = (year: number, month: number) => {
    // Logic to auto-generate sessions based on periodicity
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    const daysInMonth = eachDayOfInterval({ start, end });

    const newSessions: Session[] = [];

    patients.forEach(patient => {
      if (patient.status !== PatientStatus.ACTIVE) return;
      if (patient.periodicity === Periodicity.SINGLE) return; // Handled manually
      if (patient.dayOfWeek === undefined) return;

      // Filter days that match the patient's day of week
      const patientDays = daysInMonth.filter(day => getDay(day) === patient.dayOfWeek);

      patientDays.forEach((day, index) => {
        let shouldSchedule = false;

        if (patient.periodicity === Periodicity.WEEKLY) {
          shouldSchedule = true;
        } else if (patient.periodicity === Periodicity.BIWEEKLY) {
          shouldSchedule = index % 2 === 0; 
        } else if (patient.periodicity === Periodicity.MONTHLY) {
          shouldSchedule = index === 0; // First occurrence
        }

        if (shouldSchedule) {
          // Check if session already exists for this patient on this day
          const dateStr = format(day, 'yyyy-MM-dd');
          const exists = sessions.some(s => 
            s.patientId === patient.id && 
            s.date.startsWith(dateStr)
          );

          if (!exists) {
            // Default time 10:00 AM if not specified
            const sessionDate = setMinutes(setHours(day, 10), 0);
            newSessions.push({
              id: crypto.randomUUID(),
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

    if (newSessions.length > 0) {
      setSessions(prev => [...prev, ...newSessions]);
    }
  };

  const syncGoogleCalendar = () => {
    // Simulate fetching from Google Calendar API
    const today = new Date();
    const startOfWeekDate = startOfWeek(today);
    const mockEvents = [];
    
    // Generate 5 mock external events
    for (let i = 0; i < 5; i++) {
        const eventDate = addDays(startOfWeekDate, i + 1); // Tue, Wed, Thu...
        setHours(eventDate, 14 + i); // Different times
        setMinutes(eventDate, 0);
        
        // Randomly pick an existing patient name for some, and random stuff for others
        const isPatientEvent = Math.random() > 0.4;
        let eventTitle = '';
        let matchedPatientId = 'unmatched';
        let estimatedValue = 0;

        if (isPatientEvent && patients.length > 0) {
            const randomPatient = patients[Math.floor(Math.random() * patients.length)];
            eventTitle = randomPatient.name; // Exact match simulation
            matchedPatientId = randomPatient.id;
            estimatedValue = randomPatient.valuePerSession;
        } else {
            const randomTitles = ['Almoço com Mãe', 'Dentista', 'Reunião Escola', 'Academia', 'Consulta Novo Paciente (Marcos)'];
            eventTitle = randomTitles[Math.floor(Math.random() * randomTitles.length)];
        }

        mockEvents.push({
            id: crypto.randomUUID(),
            patientId: matchedPatientId,
            date: eventDate.toISOString(),
            status: SessionStatus.UNCONFIRMED,
            paid: false,
            valueSnapshot: estimatedValue,
            importedName: eventTitle
        });
    }

    // Add only if not overlapping perfectly (simple check)
    const newImportedSessions = mockEvents.filter(imported => {
        return !sessions.some(s => s.date === imported.date && s.status !== SessionStatus.UNCONFIRMED);
    });

    if (newImportedSessions.length > 0) {
        setSessions(prev => [...prev, ...newImportedSessions]);
        alert(`${newImportedSessions.length} eventos importados da Agenda Google. Verifique os itens 'A Confirmar'.`);
    } else {
        alert("Agenda já está atualizada.");
    }
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