import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Patient, Periodicity, PatientStatus, Session, SessionStatus } from '../types';
import { Plus, Search, Edit2, Phone, Calendar as CalendarIcon, ChevronLeft, ChevronRight, FileText, Save, Check, X, Clock, DollarSign, Mail, CalendarClock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameMonth, subMonths, addMonths, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';

// --- Modal de Edição/Criação de Paciente (Dados Cadastrais) ---
const PatientFormModal = ({ isOpen, onClose, patient = null }: { isOpen: boolean; onClose: () => void; patient?: Patient | null }) => {
  const { addPatient, updatePatient } = useAppContext();
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    valuePerSession: 150,
    periodicity: Periodicity.WEEKLY,
    dayOfWeek: 1,
    status: PatientStatus.ACTIVE,
    notes: '',
    requiresReceipt: false
  });

  useEffect(() => {
    if (patient) {
      setFormData(patient);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        birthDate: '',
        valuePerSession: 150,
        periodicity: Periodicity.WEEKLY,
        dayOfWeek: 1,
        status: PatientStatus.ACTIVE,
        notes: '',
        requiresReceipt: false
      });
    }
  }, [patient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patient) {
      updatePatient({ ...formData, id: patient.id } as Patient);
    } else {
      addPatient(formData as Omit<Patient, 'id'>);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-xl font-bold text-slate-800">
            {patient ? 'Editar Dados Cadastrais' : 'Novo Paciente'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
              <input type="text" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
              <input type="date" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.birthDate || ''} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
            </div>
            
            {/* Campos de Contato Adicionados/Verificados */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" 
                  placeholder="exemplo@email.com"
                  value={formData.email || ''} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" 
                  placeholder="(00) 00000-0000"
                  value={formData.phone || ''} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor por Sessão (R$)</label>
              <input type="number" required min="0" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.valuePerSession} onChange={e => setFormData({ ...formData, valuePerSession: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as PatientStatus })}>
                <option value={PatientStatus.ACTIVE}>Ativo</option>
                <option value={PatientStatus.PAUSED}>Em Pausa</option>
                <option value={PatientStatus.ARCHIVED}>Encerrado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Periodicidade</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.periodicity} onChange={e => setFormData({ ...formData, periodicity: e.target.value as Periodicity })}>
                <option value={Periodicity.WEEKLY}>Semanal</option>
                <option value={Periodicity.BIWEEKLY}>Quinzenal</option>
                <option value={Periodicity.MONTHLY}>Mensal</option>
                <option value={Periodicity.SINGLE}>Avulso</option>
              </select>
            </div>
            {formData.periodicity !== Periodicity.SINGLE && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dia Fixo da Semana</label>
                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}>
                  <option value={0}>Domingo</option>
                  <option value={1}>Segunda-feira</option>
                  <option value={2}>Terça-feira</option>
                  <option value={3}>Quarta-feira</option>
                  <option value={4}>Quinta-feira</option>
                  <option value={5}>Sexta-feira</option>
                  <option value={6}>Sábado</option>
                </select>
              </div>
            )}

            {/* Novo Campo: Recibo */}
            <div className="col-span-1 md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between mt-2">
                <div>
                    <label className="font-medium text-slate-700 block">Emitir Recibo?</label>
                    <span className="text-xs text-slate-500">Lembrar de gerar recibo mensalmente</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.requiresReceipt || false}
                        onChange={(e) => setFormData({...formData, requiresReceipt: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
            </div>

          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Salvar Dados</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Modal de Detalhes do Paciente (Prontuário, Estatísticas e Gestão) ---
const PatientDetailsModal = ({ isOpen, onClose, patient }: { isOpen: boolean; onClose: () => void; patient: Patient | null }) => {
  const { sessions, updateSession, updatePatient, generateMonthlySessions } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isNotesChanged, setIsNotesChanged] = useState(false);

  useEffect(() => {
    if (patient) {
      setNotes(patient.notes || '');
      setIsNotesChanged(false);
    }
  }, [patient]);

  useEffect(() => {
    if (isOpen) {
        generateMonthlySessions(currentDate.getFullYear(), currentDate.getMonth());
    }
  }, [currentDate, isOpen]);

  if (!isOpen || !patient) return null;

  const monthSessions = sessions.filter(s => 
    s.patientId === patient.id && isSameMonth(parseISO(s.date), currentDate)
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Próximas sessões agendadas (Futuro)
  const upcomingSessions = sessions.filter(s => 
    s.patientId === patient.id && 
    s.status === SessionStatus.SCHEDULED && 
    isAfter(parseISO(s.date), new Date())
  )
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  .slice(0, 5); // Mostrar apenas as 5 próximas

  const stats = {
    total: monthSessions.length,
    completed: monthSessions.filter(s => s.status === SessionStatus.COMPLETED).length,
    absent: monthSessions.filter(s => s.status === SessionStatus.PATIENT_ABSENT).length,
    valueExpected: monthSessions.reduce((acc, s) => s.status !== SessionStatus.CANCELLED ? acc + s.valueSnapshot : acc, 0),
    valuePaid: monthSessions.reduce((acc, s) => s.paid ? acc + s.valueSnapshot : acc, 0)
  };

  const handleSaveNotes = () => {
    updatePatient({ ...patient, notes });
    setIsNotesChanged(false);
  };

  const handleStatusChange = (session: Session, newStatus: SessionStatus) => {
    updateSession({ ...session, status: newStatus });
  };

  const handlePaymentToggle = (session: Session) => {
    updateSession({ ...session, paid: !session.paid });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{patient.name}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                        patient.status === PatientStatus.ACTIVE ? 'border-green-400 text-green-400' : 'border-amber-400 text-amber-400'
                    }`}>
                        {patient.status === PatientStatus.ACTIVE ? 'Ativo' : 'Pausado'}
                    </span>
                    {patient.requiresReceipt && (
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 border border-indigo-400 text-indigo-300 flex items-center gap-1">
                            <FileText size={10} /> Com Recibo
                        </span>
                    )}
                </div>
                {/* Exibição de Telefone e E-mail no Header do Modal */}
                <div className="text-slate-400 text-sm flex flex-wrap gap-x-6 gap-y-2">
                    <span className="flex items-center gap-1.5"><Phone size={14} className="text-teal-400"/> {patient.phone || 'Sem telefone'}</span>
                    <span className="flex items-center gap-1.5"><Mail size={14} className="text-teal-400"/> {patient.email || 'Sem e-mail'}</span>
                    <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-teal-400"/> R$ {patient.valuePerSession}</span>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X size={28} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Coluna Esquerda: Estatísticas e Sessões */}
                <div className="lg:col-span-2 space-y-6">
                    
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                            <ChevronLeft size={20} />
                        </button>
                        <h3 className="text-lg font-bold text-slate-800 capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                        </h3>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                            <p className="text-xs text-blue-600 font-semibold uppercase">Realizadas</p>
                            <p className="text-2xl font-bold text-blue-800">{stats.completed}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                            <p className="text-xs text-red-600 font-semibold uppercase">Faltas</p>
                            <p className="text-2xl font-bold text-red-800">{stats.absent}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                            <p className="text-xs text-emerald-600 font-semibold uppercase">Financeiro</p>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-emerald-800">R$ {stats.valuePaid}</span>
                                <span className="text-[10px] text-emerald-600">de R$ {stats.valueExpected}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex justify-between items-center">
                            <span>Sessões do Mês</span>
                            <span className="text-xs font-normal text-slate-400">{monthSessions.length} agendadas</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {monthSessions.map(session => (
                                <div key={session.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-[120px]">
                                        <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                            <CalendarIcon size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{format(parseISO(session.date), 'dd/MM')}</p>
                                            <p className="text-xs text-slate-500">{format(parseISO(session.date), 'HH:mm')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                                        <button 
                                            onClick={() => handleStatusChange(session, SessionStatus.COMPLETED)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                                                session.status === SessionStatus.COMPLETED 
                                                ? 'bg-white text-green-700 shadow-sm' 
                                                : 'text-slate-500 hover:text-green-700'
                                            }`}
                                            title="Realizada"
                                        >
                                            <Check size={14} /> <span className="hidden sm:inline">Realizada</span>
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(session, SessionStatus.PATIENT_ABSENT)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                                                session.status === SessionStatus.PATIENT_ABSENT 
                                                ? 'bg-white text-red-700 shadow-sm' 
                                                : 'text-slate-500 hover:text-red-700'
                                            }`}
                                            title="Falta"
                                        >
                                            <X size={14} /> <span className="hidden sm:inline">Falta</span>
                                        </button>
                                        <button 
                                            onClick={() => handleStatusChange(session, SessionStatus.SCHEDULED)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
                                                session.status === SessionStatus.SCHEDULED 
                                                ? 'bg-white text-blue-700 shadow-sm' 
                                                : 'text-slate-500 hover:text-blue-700'
                                            }`}
                                            title="Agendada"
                                        >
                                            <Clock size={14} />
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => handlePaymentToggle(session)}
                                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                                            session.paid 
                                            ? 'bg-green-100 border-green-200 text-green-600' 
                                            : 'bg-white border-slate-200 text-slate-300 hover:border-green-300'
                                        }`}
                                        title={session.paid ? "Paga" : "Marcar como paga"}
                                    >
                                        <DollarSign size={16} />
                                    </button>
                                </div>
                            ))}
                            {monthSessions.length === 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    Nenhuma sessão agendada para este mês.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Futuro e Anotações */}
                <div className="flex flex-col gap-4">
                    
                    {/* Seção de Próximos Agendamentos */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-teal-50/50 flex items-center gap-2">
                           <CalendarClock className="text-teal-700" size={18} />
                           <h4 className="font-bold text-teal-800 text-sm">Próximas Sessões</h4>
                        </div>
                        <div className="divide-y divide-slate-100">
                           {upcomingSessions.map(session => (
                               <div key={session.id} className="p-3 flex justify-between items-center text-sm hover:bg-slate-50">
                                   <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                                       <span className="font-medium text-slate-700 capitalize">
                                           {format(parseISO(session.date), "dd/MM (EEE)", { locale: ptBR })}
                                       </span>
                                   </div>
                                   <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                       {format(parseISO(session.date), "HH:mm")}
                                   </span>
                               </div>
                           ))}
                           {upcomingSessions.length === 0 && (
                               <div className="p-4 text-center text-slate-400 text-xs">
                                   Nenhuma sessão futura agendada.
                               </div>
                           )}
                        </div>
                    </div>

                    {/* Seção de Anotações */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-amber-800 font-bold">
                                <FileText size={18} />
                                Anotações Clínicas
                            </div>
                            {isNotesChanged && (
                                <span className="text-xs text-amber-600 animate-pulse">Não salvo</span>
                            )}
                        </div>
                        <textarea
                            className="flex-1 w-full p-4 resize-none outline-none bg-white text-slate-800 text-base leading-relaxed min-h-[250px]"
                            placeholder="Escreva aqui observações sobre a evolução do paciente, pontos importantes das sessões ou lembretes..."
                            value={notes}
                            onChange={(e) => {
                                setNotes(e.target.value);
                                setIsNotesChanged(true);
                            }}
                        />
                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={handleSaveNotes}
                                disabled={!isNotesChanged}
                                className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                                    isNotesChanged 
                                    ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <Save size={18} />
                                {isNotesChanged ? 'Salvar Anotações' : 'Salvo'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Página Principal ---
const Patients = () => {
  const { patients } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Efeito para lidar com navegação vinda do Dashboard
  useEffect(() => {
    if (location.state && location.state.patientId) {
        const patientFromNav = patients.find(p => p.id === location.state.patientId);
        if (patientFromNav) {
            handleOpenDetails(patientFromNav);
            // Limpa o state do history para não reabrir ao dar refresh (opcional, mas boa prática)
            window.history.replaceState({}, document.title);
        }
    }
  }, [location.state, patients]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (patient?: Patient) => {
    setEditingPatient(patient || null);
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Gerenciar Pacientes</h2>
        <button 
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Paciente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou e-mail..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPatients.map(patient => (
          <div 
            key={patient.id} 
            onClick={() => handleOpenDetails(patient)}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-teal-200 transition-all duration-300 hover:scale-[1.02] cursor-pointer relative group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center text-xl font-bold">
                {patient.name.charAt(0)}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                patient.status === PatientStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                patient.status === PatientStatus.PAUSED ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {patient.status === PatientStatus.ACTIVE ? 'Ativo' : 
                 patient.status === PatientStatus.PAUSED ? 'Pausa' : 'Encerrado'}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 truncate pr-8">{patient.name}</h3>
            
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                {patient.phone || 'Sem telefone'}
              </div>
              {/* Exibição de E-mail no Card */}
              <div className="flex items-center gap-2 truncate">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{patient.email || 'Sem e-mail'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-slate-400" />
                <span>
                  {patient.periodicity === 'WEEKLY' ? 'Semanal' : 
                   patient.periodicity === 'BIWEEKLY' ? 'Quinzenal' : 'Mensal'} 
                   {patient.dayOfWeek !== undefined && ` • ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][patient.dayOfWeek]}`}
                </span>
              </div>
              {patient.requiresReceipt && (
                  <div className="flex items-center gap-2 text-indigo-600 font-medium text-xs">
                      <FileText size={14} />
                      Emissão de Recibo Obrigatória
                  </div>
              )}
              <div className="font-medium text-slate-800 pt-2 flex items-center justify-between">
                <span>R$ {patient.valuePerSession.toFixed(2)} / sessão</span>
                <span className="text-xs text-teal-600 font-normal">Ver prontuário →</span>
              </div>
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenForm(patient);
              }}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all"
              title="Editar Cadastro"
            >
              <Edit2 size={18} />
            </button>
          </div>
        ))}
        
        {filteredPatients.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            Nenhum paciente encontrado.
          </div>
        )}
      </div>

      <PatientFormModal 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)} 
        patient={editingPatient} 
      />

      <PatientDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        patient={selectedPatient} 
      />
    </div>
  );
};

export default Patients;