import React, { useMemo, useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SessionStatus, PatientStatus, Session, Patient } from '../types';
import { isSameMonth, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, CheckCircle, AlertCircle, Wallet, Sparkles, X, Calendar as CalendarIcon, Clock, Check, User, FileText, ArrowRight, Phone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { generateFinancialInsight } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

// --- Modal de Ação Rápida (Sessão Específica) ---
const QuickSessionModal = ({ 
  session, 
  patient, 
  onClose, 
  onUpdate,
  onNavigateToProfile
}: { 
  session: Session; 
  patient?: Patient; 
  onClose: () => void; 
  onUpdate: (session: Session) => void;
  onNavigateToProfile: () => void;
}) => {
  const [notes, setNotes] = useState(session.notes || '');

  if (!patient) return null;

  const handleStatus = (status: SessionStatus) => {
    onUpdate({ ...session, status, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="bg-slate-900 p-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-lg">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">{patient.name}</h3>
              <p className="text-slate-400 text-xs flex items-center gap-1">
                <CalendarIcon size={12} />
                {format(parseISO(session.date), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
             <div className="flex items-center gap-2 text-slate-700">
                <Clock className="text-teal-600" size={18} />
                <span className="font-bold text-lg">{format(parseISO(session.date), "HH:mm")}</span>
             </div>
             <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                session.status === SessionStatus.SCHEDULED ? 'bg-blue-100 text-blue-700' :
                session.status === SessionStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
             }`}>
                {session.status === SessionStatus.SCHEDULED ? 'Agendado' : 
                 session.status === SessionStatus.COMPLETED ? 'Realizada' : 'Cancelada/Falta'}
             </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Ações Rápidas</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleStatus(SessionStatus.COMPLETED)}
                className="flex items-center justify-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                <Check size={18} />
                <span className="font-semibold text-sm">Realizada</span>
              </button>
              <button 
                 onClick={() => handleStatus(SessionStatus.PATIENT_ABSENT)}
                 className="flex items-center justify-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                <X size={18} />
                <span className="font-semibold text-sm">Falta</span>
              </button>
            </div>
          </div>

          <div>
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
               <FileText size={12} /> Nota da Sessão
             </label>
             <textarea 
                className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none bg-slate-50"
                rows={2}
                placeholder="Observação rápida sobre hoje..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => onUpdate({ ...session, notes })} 
             />
          </div>

          <div className="pt-2 border-t border-slate-100">
             <button 
                onClick={onNavigateToProfile}
                className="w-full py-2 flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-teal-600 transition-colors group"
             >
                <User size={16} />
                Ver Prontuário Completo
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Modal de Detalhes do Dashboard (Lista de Pacientes ou Sessões) ---
type DashboardDetailType = 'PATIENTS' | 'SESSIONS_COMPLETED' | 'SESSIONS_SCHEDULED';

const DashboardDetailModal = ({ 
  type, 
  data, 
  onClose,
  onNavigateToProfile
}: { 
  type: DashboardDetailType; 
  data: any[]; 
  onClose: () => void;
  onNavigateToProfile: (patientId: string) => void;
}) => {
  
  const title = 
    type === 'PATIENTS' ? 'Pacientes Ativos' : 
    type === 'SESSIONS_COMPLETED' ? 'Sessões Realizadas no Mês' : 
    'Agendamentos do Mês';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {data.length === 0 && (
            <p className="text-center text-slate-500 py-8">Nenhum registro encontrado.</p>
          )}

          {type === 'PATIENTS' && data.map((patient: Patient) => (
            <div 
              key={patient.id} 
              onClick={() => onNavigateToProfile(patient.id)}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-teal-200 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  {patient.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{patient.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone size={10} /> {patient.phone || 'Sem contato'}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
            </div>
          ))}

          {(type === 'SESSIONS_COMPLETED' || type === 'SESSIONS_SCHEDULED') && data.map((item: { session: Session, patient: Patient }) => (
            <div 
              key={item.session.id}
              onClick={() => onNavigateToProfile(item.patient.id)}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-teal-200 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[40px]">
                   <p className="text-xs font-bold text-slate-500 uppercase">{format(parseISO(item.session.date), 'MMM', {locale: ptBR})}</p>
                   <p className="text-lg font-bold text-slate-800 leading-none">{format(parseISO(item.session.date), 'dd')}</p>
                </div>
                <div>
                   <p className="font-semibold text-slate-800">{item.patient.name}</p>
                   <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> {format(parseISO(item.session.date), 'HH:mm')}
                      {type === 'SESSIONS_COMPLETED' && (
                         <span className="ml-1 text-green-600 font-medium">• Realizada</span>
                      )}
                   </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    R$ {item.session.valueSnapshot}
                 </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between transition-all duration-200 
      ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]' : ''}`}
  >
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

const Dashboard = () => {
  const { patients, sessions, updateSession } = useAppContext();
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const navigate = useNavigate();
  
  // State para o modal rápido (Sessão única)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // State para o modal de detalhes (Listas dos cards)
  const [detailModalType, setDetailModalType] = useState<DashboardDetailType | null>(null);

  const currentMonth = new Date();

  const stats = useMemo(() => {
    // Listas de dados para os modais
    const activePatientsList = patients.filter(p => p.status === PatientStatus.ACTIVE);
    
    const monthSessions = sessions.filter(s => isSameMonth(new Date(s.date), currentMonth));
    
    const completedList = monthSessions
      .filter(s => s.status === SessionStatus.COMPLETED)
      .map(s => ({ session: s, patient: patients.find(p => p.id === s.patientId) as Patient }))
      .filter(item => item.patient); // Safety check

    const scheduledList = monthSessions
      .filter(s => s.status === SessionStatus.SCHEDULED)
      .map(s => ({ session: s, patient: patients.find(p => p.id === s.patientId) as Patient }))
      .filter(item => item.patient);

    const activePatients = activePatientsList.length;
    const completed = completedList.length;
    const scheduled = scheduledList.length;
    
    const totalExpected = monthSessions.reduce((acc, s) => {
       if (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.PATIENT_ABSENT) {
         return acc + s.valueSnapshot;
       }
       return acc;
    }, 0);

    const totalReceived = monthSessions.reduce((acc, s) => s.paid ? acc + s.valueSnapshot : acc, 0);
    const absentCount = monthSessions.filter(s => s.status === SessionStatus.PATIENT_ABSENT).length;
    const pendingSessions = monthSessions.filter(s => 
      (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.PATIENT_ABSENT) && !s.paid
    ).length;

    return { 
      activePatients, completed, scheduled, totalExpected, totalReceived, pendingSessions, absentCount,
      lists: { activePatientsList, completedList, scheduledList } 
    };
  }, [patients, sessions]);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoadingInsight(true);
      const result = await generateFinancialInsight(
        format(currentMonth, 'MMMM/yyyy', { locale: ptBR }),
        stats.totalExpected,
        stats.totalReceived,
        stats.pendingSessions,
        stats.absentCount
      );
      setInsight(result);
      setLoadingInsight(false);
    };

    if (process.env.API_KEY) {
      fetchInsight();
    }
  }, [stats.totalExpected, stats.totalReceived]);

  const chartData = [
    { name: 'Recebido', value: stats.totalReceived },
    { name: 'Pendente', value: stats.totalExpected - stats.totalReceived },
  ];

  // Helper para o modal de sessão única
  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const selectedPatient = selectedSession ? patients.find(p => p.id === selectedSession.patientId) : undefined;

  // Handler para navegação
  const handleNavigateToProfile = (patientId: string) => {
    navigate('/patients', { state: { patientId } });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
        <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border shadow-sm capitalize">
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>

      {/* AI Insight Banner */}
      {process.env.API_KEY && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-yellow-300" />
              <h3 className="font-semibold">Assistente Inteligente</h3>
            </div>
            <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
              {loadingInsight ? "Analisando dados do consultório..." : insight}
            </p>
          </div>
          <div className="absolute right-0 top-0 h-full w-32 bg-white opacity-5 transform skew-x-12 translate-x-8"></div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pacientes Ativos" 
          value={stats.activePatients} 
          icon={Users} 
          color="bg-teal-500" 
          onClick={() => setDetailModalType('PATIENTS')}
        />
        <StatCard 
          title="Sessões Realizadas" 
          value={stats.completed} 
          icon={CheckCircle} 
          color="bg-blue-500" 
          onClick={() => setDetailModalType('SESSIONS_COMPLETED')}
        />
        <StatCard 
          title="Agendamentos" 
          value={stats.scheduled} 
          icon={AlertCircle} 
          color="bg-amber-500" 
          onClick={() => setDetailModalType('SESSIONS_SCHEDULED')}
        />
        <StatCard 
          title="Previsão Mensal" 
          value={`R$ ${stats.totalExpected.toFixed(2)}`} 
          icon={Wallet} 
          color="bg-emerald-500" 
          // Sem clique para financeiro por enquanto, ou poderia levar para a aba Financeiro
          onClick={() => navigate('/financial')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
             <CalendarIcon size={20} className="text-slate-400" /> Próximas Sessões
          </h3>
          <div className="space-y-4 flex-1">
            {sessions
              .filter(s => s.status === SessionStatus.SCHEDULED && new Date(s.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .slice(0, 4)
              .map(session => {
                const patient = patients.find(p => p.id === session.patientId);
                return (
                  <div 
                    key={session.id} 
                    onClick={() => setSelectedSessionId(session.id)}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-white hover:border-teal-300 hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold group-hover:bg-teal-600 group-hover:text-white transition-colors text-sm">
                        {patient?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 group-hover:text-teal-700 transition-colors">{patient?.name}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <Clock size={12} />
                          {format(new Date(session.date), "dd/MM (EEE) 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium text-teal-700 bg-teal-50 rounded-full border border-teal-100 group-hover:bg-teal-100">
                      Gerenciar
                    </span>
                  </div>
                );
              })}
              {sessions.filter(s => s.status === SessionStatus.SCHEDULED && new Date(s.date) >= new Date()).length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                   <CalendarIcon size={32} className="mb-2 opacity-20" />
                   <p>Nenhum agendamento próximo.</p>
                </div>
              )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Balanço Mensal</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Renderização do Modal de Sessão Única (Quick Action) */}
      {selectedSession && selectedPatient && (
        <QuickSessionModal 
          session={selectedSession}
          patient={selectedPatient}
          onClose={() => setSelectedSessionId(null)}
          onUpdate={updateSession}
          onNavigateToProfile={() => handleNavigateToProfile(selectedPatient.id)}
        />
      )}

      {/* Renderização do Modal de Detalhes do Dashboard (Listas) */}
      {detailModalType && (
        <DashboardDetailModal 
          type={detailModalType}
          data={
            detailModalType === 'PATIENTS' ? stats.lists.activePatientsList :
            detailModalType === 'SESSIONS_COMPLETED' ? stats.lists.completedList :
            stats.lists.scheduledList
          }
          onClose={() => setDetailModalType(null)}
          onNavigateToProfile={handleNavigateToProfile}
        />
      )}

    </div>
  );
};

export default Dashboard;